import * as monaco from 'monaco-editor';
import './style.css';

// Workers de Monaco
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

import { initState, newFile, saveState, registerEditorRef, getActiveContent, getFilesSnapshot, loadExample, importMultipleFiles } from './files.js';
import { initEditor } from './editor.js';
import { initDropzone } from './dropzone.js';
import { initZipHandlers, importZipFileWithDialog } from './zip.js';
import { initCloudHandlers } from './cloud.js';
import { initFsAccessHandlers } from './fs-access.js';
import { initPyodideWorker } from './workers/pyodide-worker-bridge.js';
import { initResponsive } from './responsive.js';
import { initMobileToolbar } from './mobile-toolbar.js';
// ============================================================
// MONACO ENVIRONMENT
// ============================================================
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  }
};

// ============================================================
// UTILIDADES GLOBALES
// ============================================================
let toastTimer;
export function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'show' + (type !== 'info' ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

export function setStatus(text, cls) {
  const el = document.getElementById('status');
  el.className = 'status ' + cls;
  el.innerHTML = text;
}

export function appendOutput(text, className = 'stdout') {
  const out = document.getElementById('output');
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
}

export function appendSVG(svgString) {
  const out = document.getElementById('output');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = svgString;
  const svg = wrapper.querySelector('svg');
  if (svg) {
    out.appendChild(svg);
    out.scrollTop = out.scrollHeight;
  }
}

export function clearOutput() {
  document.getElementById('output').innerHTML = '';
  document.getElementById('exec-time').textContent = '';
}

// ============================================================
// ESTADO GLOBAL DE UI
// ============================================================
let editorGlobal = null;
let workerGlobal = null;
let isRunning = false;

// ============================================================
// INIT
// ============================================================
async function bootstrap() {
  initState();

  // 1. Editor Monaco
  editorGlobal = await initEditor(monaco);
  window.__editor = editorGlobal;
  registerEditorRef(editorGlobal);
  appendOutput('✅ Monaco Editor cargado\n', 'info');

  // 2. Worker de Pyodide
  workerGlobal = initPyodideWorker({
    onReady: () => {
      setStatus('✓ Pyodide listo', 'ready');
      document.getElementById('run-btn').disabled = false;
    },
    onInitError: (err) => {
      setStatus('✗ Error Pyodide', 'error');
      appendOutput('Error Pyodide: ' + err + '\n', 'error');
    },
    onStdout: (t) => appendOutput(t, 'stdout'),
    onStderr: (t) => appendOutput(t, 'stderr'),
    onSVG: (svg) => appendSVG(svg),
    onInputRequest: (prompt) => showInputModal(prompt, workerGlobal),
    onRunStart: () => setStatus('<span class="spinner"></span>Ejecutando...', 'running'),
    onRunEnd: (ms) => {
      document.getElementById('exec-time').textContent = `✓ ${ms.toFixed(0)} ms`;
      setStatus('✓ Pyodide listo', 'ready');
      finishRun();
    },
    onRunError: (err) => {
      appendOutput(err + '\n', 'error');
      setStatus('✓ Pyodide listo', 'ready');
      finishRun();
    },
    onPackageLoaded: (pkg) => appendOutput(`✅ Paquete "${pkg}" cargado.\n`, 'info'),
    onPackageError: (pkg, err) => appendOutput(`✗ Error cargando "${pkg}": ${err}\n`, 'error')
  });
  window.__worker = workerGlobal;

  // 3. Módulos de UI
  initDropzone({ importFiles: importFilesHandler });
  initZipHandlers();
  initCloudHandlers();
  initFsAccessHandlers();

  // 4. Botones y atajos
  bindHeaderButtons();
  bindKeyboardShortcuts(editorGlobal);

  // 5. Layout responsivo (splitter, menú móvil, orientación)
  initResponsive();

  // 6. Barra de atajos móvil (solo se muestra en táctil/vertical)
  initMobileToolbar(editorGlobal);

  window.addEventListener('beforeunload', saveState);
  appendOutput('✅ Todo listo. Usa Ctrl+Enter para ejecutar.\n\n', 'info');
}

// ============================================================
// BOTONES
// ============================================================
function bindHeaderButtons() {
  document.getElementById('run-btn').addEventListener('click', runCode);
  document.getElementById('clear-btn').addEventListener('click', clearOutput);
  document.getElementById('tab-add').addEventListener('click', () => newFile());

  document.getElementById('stop-btn').addEventListener('click', () => {
    if (workerGlobal) workerGlobal.terminate();
    appendOutput('\n⛔ Ejecución detenida. Recargando...\n', 'error');
    finishRun();
    setTimeout(() => location.reload(), 500);
  });

  document.getElementById('pkg-select').addEventListener('change', (e) => {
    const pkg = e.target.value;
    if (!pkg || !workerGlobal) return;
    appendOutput(`⏳ Cargando ${pkg}...\n`, 'info');
    workerGlobal.loadPackage(pkg);
    e.target.value = '';
  });

  document.getElementById('example-select').addEventListener('change', (e) => {
    const key = e.target.value;
    if (!key) return;
    loadExample(key);
    e.target.value = '';
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('¿Borrar TODOS los archivos?')) return;
    localStorage.removeItem('pyeditor_pro_v6');
    location.reload();
  });
}

// ============================================================
// ATAJOS DE TECLADO
// ============================================================
function bindKeyboardShortcuts(editor) {
  const mod = monaco.KeyMod;
  const k = monaco.KeyCode;

  editor.addCommand(mod.CtrlCmd | k.Enter, runCode);
  editor.addCommand(mod.CtrlCmd | k.KeyL, clearOutput);
  editor.addCommand(mod.CtrlCmd | k.KeyS, () => {
    saveState();
    appendOutput('💾 Guardado\n', 'info');
  });
  editor.addCommand(mod.CtrlCmd | k.KeyN, () => newFile());
  editor.addCommand(mod.CtrlCmd | k.KeyO, () => document.getElementById('import-btn').click());
  editor.addCommand(mod.CtrlCmd | k.KeyE, () => document.getElementById('export-btn').click());
  editor.addCommand(mod.CtrlCmd | mod.Shift | k.KeyO, () => document.getElementById('import-zip-btn').click());
  editor.addCommand(mod.CtrlCmd | mod.Shift | k.KeyE, () => document.getElementById('export-zip-btn').click());
}

// ============================================================
// EJECUCIÓN
// ============================================================
export function runCode() {
  if (!workerGlobal || isRunning) return;
  isRunning = true;
  document.getElementById('run-btn').disabled = true;
  document.getElementById('stop-btn').disabled = false;
  document.getElementById('run-btn').textContent = '⏳ Ejecutando...';
  appendOutput('\n' + '─'.repeat(50) + '\n', 'info');

  const code = getActiveContent();
  const files = getFilesSnapshot();
  workerGlobal.run(code, files);
}

function finishRun() {
  isRunning = false;
  const rb = document.getElementById('run-btn');
  if (rb) {
    rb.disabled = false;
    rb.textContent = '▶ Ejecutar';
  }
  const sb = document.getElementById('stop-btn');
  if (sb) sb.disabled = true;
}

// ============================================================
// MODAL INPUT
// ============================================================
export function showInputModal(promptText, worker) {
  const modal = document.getElementById('input-modal');
  const prompt = document.getElementById('modal-prompt');
  const input = document.getElementById('modal-input');
  const submitBtn = document.getElementById('modal-submit');

  prompt.textContent = promptText || '';
  input.value = '';
  modal.classList.add('active');
  setTimeout(() => input.focus(), 30);

  const cleanup = () => {
    modal.classList.remove('active');
    input.removeEventListener('keydown', keyHandler);
    submitBtn.removeEventListener('click', clickHandler);
  };

  const submit = (value) => {
    cleanup();
    appendOutput((promptText || '') + value + '\n', 'prompt');
    worker.sendInput(value);
  };

  const keyHandler = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(input.value); }
    if (e.key === 'Escape') { e.preventDefault(); submit(''); }
  };
  const clickHandler = () => submit(input.value);

  input.addEventListener('keydown', keyHandler);
  submitBtn.addEventListener('click', clickHandler);
}

// ============================================================
// IMPORTAR ARCHIVOS (drag & drop)
// ============================================================
async function importFilesHandler(files) {
  const zips = files.filter(f => f.path.toLowerCase().endsWith('.zip'));
  const others = files.filter(f => !f.path.toLowerCase().endsWith('.zip'));

  if (others.length) {
    const result = await importMultipleFiles(others);
    showToast(`📥 ${result.imported} importados · ${result.skipped} saltados`, 'info');
  }

  for (const { file } of zips) {
    showToast(`📦 Extrayendo ${file.name}...`, 'info');
    await importZipFileWithDialog(file);
  }
}

// ============================================================
// ARRANQUE
// ============================================================
bootstrap().catch(err => {
  console.error('Error fatal:', err);
  document.getElementById('output').innerHTML =
    '<span class="error">Error fatal: ' + err.message + '</span>';
});