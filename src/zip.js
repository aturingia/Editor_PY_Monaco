import { DROP_EXTENSIONS } from './config.js';
import { state, renderTabs, scheduleSave } from './files.js';
import { showConflictDialog } from './conflicts.js';
import { showToast, appendOutput } from './main.js';

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportProjectAsZip(customName = null) {
  if (typeof JSZip === 'undefined') {
    showToast('JSZip no cargado', 'error');
    return;
  }

  const { syncActiveContent, getFilesSnapshot } = await import('./files.js');
  syncActiveContent();
  const files = getFilesSnapshot();

  if (!files.length) {
    showToast('No hay archivos', 'warn');
    return;
  }

  const zip = new JSZip();
  files.forEach(f => zip.file(f.name, f.content));

  zip.file('.pyeditor-meta.json', JSON.stringify({
    exportedAt: new Date().toISOString(),
    fileCount: files.length,
    editor: 'Python Editor Pro'
  }, null, 2));

  showToast('📦 Generando ZIP...', 'info');
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filename = customName || `python-project-${ts}.zip`;
  downloadBlob(blob, filename);

  showToast(`📦 Exportados ${files.length} archivos`, 'info');
  appendOutput(`📦 Proyecto exportado: "${filename}" (${files.length} archivos)\n`, 'info');
}

export async function importZipFileWithDialog(file) {
  if (typeof JSZip === 'undefined') {
    showToast('JSZip no cargado', 'error');
    return { imported: 0, updated: 0, skipped: 0, errors: [] };
  }

  const result = { imported: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const zip = await JSZip.loadAsync(file);
    const entries = [];

    zip.forEach((path, zipEntry) => {
      if (zipEntry.dir) return;
      const baseName = path.split('/').pop();
      if (baseName.startsWith('.')) return;
      if (path.includes('__pycache__/')) return;
      if (path.includes('node_modules/')) return;
      if (path.endsWith('.DS_Store')) return;

      const ext = '.' + baseName.split('.').pop().toLowerCase();
      if (!DROP_EXTENSIONS.includes(ext)) return;

      entries.push({ name: path, zipEntry });
    });

    if (!entries.length) {
      showToast('ZIP sin archivos compatibles', 'warn');
      return result;
    }

    const incoming = [];
    for (const { name, zipEntry } of entries) {
      try {
        const content = await zipEntry.async('string');
        incoming.push({ name, content });
      } catch (err) {
        result.errors.push({ name, error: err.message });
      }
    }

    const existingNames = new Set(state.files.map(f => f.name));
    const conflicts = [];
    const news = [];

    for (const inc of incoming) {
      if (existingNames.has(inc.name)) {
        const existing = state.files.find(f => f.name === inc.name);
        conflicts.push({ name: inc.name, oldContent: existing.content, newContent: inc.content });
      } else {
        news.push(inc);
      }
    }

    for (const inc of news) {
      state.files.push({ id: state.nextId++, name: inc.name, content: inc.content });
      result.imported++;
    }

    if (conflicts.length > 0) {
      const decisions = await showConflictDialog(conflicts);
      if (decisions === null) {
        showToast(`📦 ${news.length} nuevos · conflictos cancelados`, 'warn');
      } else {
        for (const d of decisions) {
          if (d.action === 'skip') { result.skipped++; continue; }
          if (d.action === 'replace') {
            const existing = state.files.find(f => f.name === d.name);
            if (existing) { existing.content = d.content; result.updated++; }
          } else if (d.action === 'rename' && d.newName) {
            state.files.push({ id: state.nextId++, name: d.newName, content: d.content });
            result.imported++;
          }
        }
      }
    }

    if (result.imported || result.updated) {
      const last = state.files[state.files.length - 1];
      state.activeId = last.id;
      renderTabs();
      scheduleSave();
      const editorRef = window.__editor;
      if (editorRef) editorRef.setValue(last.content);
    }

    const parts = [];
    if (result.imported) parts.push(`${result.imported} nuevos`);
    if (result.updated) parts.push(`${result.updated} actualizados`);
    if (result.skipped) parts.push(`${result.skipped} saltados`);
    if (result.errors.length) parts.push(`${result.errors.length} errores`);

    showToast(`📦 ${file.name}: ${parts.join(' · ')}`, result.errors.length ? 'warn' : 'info');
    appendOutput(`📦 ${file.name}: ${parts.join(' · ')}\n`, 'info');

    return result;
  } catch (err) {
    showToast(`Error ZIP: ${err.message}`, 'error');
    result.errors.push({ name: file.name, error: err.message });
    return result;
  }
}

export function initZipHandlers() {
  document.getElementById('import-zip-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      showToast(`📦 Extrayendo ${file.name}...`, 'info');
      await importZipFileWithDialog(file);
    };
    input.click();
  });

  document.getElementById('export-zip-btn').addEventListener('click', () => exportProjectAsZip());

  document.getElementById('import-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,text/x-python';
    input.multiple = true;
    input.onchange = async (e) => {
      const { importMultipleFiles } = await import('./files.js');
      const files = Array.from(e.target.files).map(f => ({ file: f, path: f.name }));
      const r = await importMultipleFiles(files);
      showToast(`📥 ${r.imported} importados · ${r.skipped} saltados`, 'info');
    };
    input.click();
  });

  document.getElementById('export-btn').addEventListener('click', async () => {
    const { syncActiveContent, state: st } = await import('./files.js');
    syncActiveContent();
    const f = st.files.find(x => x.id === st.activeId);
    if (!f) return;
    const blob = new Blob([f.content], { type: 'text/x-python;charset=utf-8' });
    downloadBlob(blob, f.name);
    showToast(`📤 "${f.name}" exportado`, 'info');
  });
}