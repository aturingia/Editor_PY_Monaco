import { STORAGE_KEY, AUTOSAVE_DELAY, EXAMPLES, EXAMPLES_MULTIFILE, DROP_EXTENSIONS, MAX_FILE_SIZE } from './config.js';

export const state = {
  files: [],
  activeId: null,
  nextId: 1
};

let editorRef = null;
let _saveTimer = null;
let _autosaveTimer = null;

export function registerEditorRef(editor) {
  editorRef = editor;
}

export function initState() {
  if (!loadState()) {
    state.files = [{ id: state.nextId++, name: 'main.py', content: EXAMPLES.hello }];
    state.activeId = state.files[0].id;
  }
}

export function newFile(name = null, content = '') {
  const id = state.nextId++;
  const file = { id, name: name || `script_${id}.py`, content };
  state.files.push(file);
  state.activeId = file.id;
  if (editorRef) editorRef.setValue(content);
  renderTabs();
  scheduleSave();
  return file;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed.files || !parsed.files.length) return false;
    Object.assign(state, parsed);
    return true;
  } catch { return false; }
}

export function saveState() {
  try {
    syncActiveContent();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showAutosave();
  } catch (e) { console.warn(e); }
}

export function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveState, AUTOSAVE_DELAY);
}

function showAutosave() {
  const el = document.getElementById('autosave');
  if (!el) return;
  el.classList.add('show');
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(() => el.classList.remove('show'), 1200);
}

export function syncActiveContent() {
  if (!editorRef || !state.activeId) return;
  const f = state.files.find(f => f.id === state.activeId);
  if (f) f.content = editorRef.getValue();
}

export function getActiveContent() {
  return editorRef ? editorRef.getValue() : '';
}

export function getFilesSnapshot() {
  syncActiveContent();
  return state.files.map(f => ({ name: f.name, content: f.content }));
}

export function switchFile(id) {
  if (!editorRef || state.activeId === id) return;
  syncActiveContent();
  state.activeId = id;
  const next = state.files.find(f => f.id === id);
  if (next) editorRef.setValue(next.content);
  renderTabs();
  scheduleSave();
}

export function closeFile(id) {
  const idx = state.files.findIndex(f => f.id === id);
  if (idx === -1) return;
  const wasActive = state.activeId === id;
  state.files.splice(idx, 1);
  if (!state.files.length) {
    newFile('main.py', '');
    return;
  }
  if (wasActive) {
    const next = state.files[Math.max(0, idx - 1)];
    state.activeId = next.id;
    if (editorRef) editorRef.setValue(next.content);
  }
  renderTabs();
  scheduleSave();
}

export function generateUniqueName(baseName) {
  const dotIdx = baseName.lastIndexOf('.');
  const stem = dotIdx > 0 ? baseName.slice(0, dotIdx) : baseName;
  const ext = dotIdx > 0 ? baseName.slice(dotIdx) : '';
  let i = 1;
  let candidate;
  do {
    candidate = `${stem}_${i}${ext}`;
    i++;
  } while (state.files.some(f => f.name === candidate));
  return candidate;
}

export async function importMultipleFiles(files) {
  let imported = 0;
  let skipped = 0;

  for (const { file, path } of files) {
    const baseName = path.split('/').pop();
    if (baseName.startsWith('.')) continue;
    if (path.includes('__pycache__/')) continue;

    const ext = '.' + baseName.split('.').pop().toLowerCase();
    if (!DROP_EXTENSIONS.includes(ext)) { skipped++; continue; }
    if (file.size > MAX_FILE_SIZE) { skipped++; continue; }

    let content;
    try { content = await file.text(); }
    catch { skipped++; continue; }

    const existing = state.files.find(f => f.name === path);
    if (existing) {
      existing.content = content;
    } else {
      state.files.push({ id: state.nextId++, name: path, content });
      imported++;
    }
  }

  if (state.files.length) {
    const last = state.files[state.files.length - 1];
    state.activeId = last.id;
    if (editorRef) editorRef.setValue(last.content);
  }
  renderTabs();
  scheduleSave();
  return { imported, skipped };
}

export function renderTabs() {
  const tabsBar = document.getElementById('tabs-bar');
  if (!tabsBar) return;

  [...tabsBar.querySelectorAll('.tab')].forEach(t => t.remove());
  const addBtn = document.getElementById('tab-add');

  state.files.forEach(file => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (file.id === state.activeId ? ' active' : '');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tab-name';
    nameSpan.textContent = file.name;
    nameSpan.title = 'Doble clic para renombrar';

    const closeSpan = document.createElement('span');
    closeSpan.className = 'close-tab';
    closeSpan.textContent = '×';

    tab.appendChild(nameSpan);
    tab.appendChild(closeSpan);

    tab.addEventListener('click', (e) => {
      if (e.target === closeSpan) return;
      if (e.target === nameSpan && nameSpan.isContentEditable) return;
      switchFile(file.id);
    });

    nameSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      nameSpan.contentEditable = 'true';
      nameSpan.focus();
      document.execCommand('selectAll', false, null);
    });

    const finishRename = () => {
      nameSpan.contentEditable = 'false';
      const newName = nameSpan.textContent.trim() || file.name;
      file.name = newName;
      nameSpan.textContent = newName;
      scheduleSave();
    };
    nameSpan.addEventListener('blur', finishRename);
    nameSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); nameSpan.blur(); }
      if (e.key === 'Escape') { nameSpan.textContent = file.name; nameSpan.blur(); }
    });

    closeSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      closeFile(file.id);
    });

    tabsBar.insertBefore(tab, addBtn);
  });
}

export function loadExample(key) {
  if (key === 'multifile') {
    Object.entries(EXAMPLES_MULTIFILE).forEach(([name, content]) => {
      const existing = state.files.find(f => f.name === name);
      if (existing) existing.content = content;
      else state.files.push({ id: state.nextId++, name, content });
    });
    const main = state.files.find(f => f.name === 'main.py');
    if (main) {
      state.activeId = main.id;
      if (editorRef) editorRef.setValue(main.content);
    }
    renderTabs();
    scheduleSave();
    return;
  }
  if (EXAMPLES[key]) {
    state.files.push({ id: state.nextId++, name: `ejemplo_${key}.py`, content: EXAMPLES[key] });
    const f = state.files[state.files.length - 1];
    state.activeId = f.id;
    if (editorRef) editorRef.setValue(f.content);
    renderTabs();
    scheduleSave();
  }
}