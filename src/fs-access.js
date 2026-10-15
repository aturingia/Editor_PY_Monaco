import { showToast, appendOutput } from './main.js';
import { state, syncActiveContent, renderTabs, scheduleSave } from './files.js';

export function initFsAccessHandlers() {
  const openBtn = document.getElementById('folder-open-btn');
  const saveBtn = document.getElementById('folder-save-btn');

  if (!window.showDirectoryPicker) {
    openBtn.disabled = true;
    saveBtn.disabled = true;
    openBtn.title = 'Requiere Chrome/Edge';
    saveBtn.title = 'Requiere Chrome/Edge';
    return;
  }

  openBtn.addEventListener('click', async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      const imported = [];
      await walkDirectory(dirHandle, '', imported);

      for (const { name, content } of imported) {
        const existing = state.files.find(f => f.name === name);
        if (existing) existing.content = content;
        else state.files.push({ id: state.nextId++, name, content });
      }

      if (imported.length) {
        const last = state.files[state.files.length - 1];
        state.activeId = last.id;
        const editorRef = window.__editor;
        if (editorRef) editorRef.setValue(last.content);
        renderTabs();
        scheduleSave();
      }
      showToast(`📂 ${imported.length} archivos importados`, 'info');
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Error: ' + e.message, 'error');
    }
  });

  saveBtn.addEventListener('click', async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      syncActiveContent();

      for (const file of state.files) {
        const parts = file.name.split('/');
        let dir = dirHandle;
        for (const part of parts.slice(0, -1)) {
          dir = await dir.getDirectoryHandle(part, { create: true });
        }
        const fh = await dir.getFileHandle(parts[parts.length - 1], { create: true });
        const w = await fh.createWritable();
        await w.write(file.content);
        await w.close();
      }
      showToast(`💾 ${state.files.length} archivos guardados`, 'info');
      appendOutput(`💾 Guardados en carpeta local (${state.files.length} archivos)\n`, 'info');
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Error: ' + e.message, 'error');
    }
  });
}

async function walkDirectory(dirHandle, prefix, results) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      if (!entry.name.endsWith('.py')) continue;
      const file = await entry.getFile();
      const content = await file.text();
      results.push({ name: prefix + entry.name, content });
    } else if (entry.kind === 'directory') {
      if (entry.name === '__pycache__' || entry.name.startsWith('.')) continue;
      await walkDirectory(entry, prefix + entry.name + '/', results);
    }
  }
}