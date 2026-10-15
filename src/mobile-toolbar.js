// ============================================================
// BARRA DE ATAJOS PARA MÓVIL
// ============================================================

let editorRef = null;
let toolbarEl = null;
let isEnabled = false;
let pressTimer = null;
let isRepeating = false;

// Detectar si estamos en dispositivo táctil
function isTouchDevice() {
  return ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0) ||
         window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

// Detectar móvil/tablet en modo vertical (donde tiene sentido la barra)
function shouldShowToolbar() {
  const isSmallScreen = window.innerWidth <= 1024;
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  return isTouchDevice() && isSmallScreen;
}

// ============================================================
// INSERCIÓN DE TEXTO EN EL EDITOR
// ============================================================
function insertText(text, cursorOffset = null) {
  if (!editorRef) return;

  const selection = editorRef.getSelection();
  const model = editorRef.getModel();
  if (!selection || !model) return;

  // Si hay selección y el texto es un "envoltorio" tipo ( o "
  // → envolver la selección
  if (!selection.isEmpty() && isWrapChar(text)) {
    const selectedText = model.getValueInRange(selection);
    const wrapped = text + selectedText + getClosingChar(text);
    editorRef.executeEdits('toolbar', [{
      range: selection,
      text: wrapped,
      forceMoveMarkers: true
    }]);
    // Posicionar cursor después del cierre
    const endPos = {
      lineNumber: selection.endLineNumber,
      column: selection.endColumn + text.length + getClosingChar(text).length
    };
    editorRef.setPosition(endPos);
    editorRef.focus();
    return;
  }

  // Inserción simple en la posición del cursor
  const pos = selection.getPosition();
  const insert = text;

  editorRef.executeEdits('toolbar', [{
    range: {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: selection.endLineNumber,
      endColumn: selection.endColumn
    },
    text: insert,
    forceMoveMarkers: true
  }]);

  // Reposicionar el cursor
  if (cursorOffset !== null) {
    // Calcular posición relativa al offset
    const lines = insert.split('\n');
    if (lines.length === 1) {
      editorRef.setPosition({
        lineNumber: pos.lineNumber,
        column: pos.column + cursorOffset
      });
    } else {
      editorRef.setPosition({
        lineNumber: pos.lineNumber + lines.length - 1,
        column: lines[lines.length - 1].length + 1
      });
    }
  } else {
    // Por defecto: al final del texto insertado
    const lines = insert.split('\n');
    if (lines.length === 1) {
      editorRef.setPosition({
        lineNumber: pos.lineNumber,
        column: pos.column + insert.length
      });
    } else {
      editorRef.setPosition({
        lineNumber: pos.lineNumber + lines.length - 1,
        column: lines[lines.length - 1].length + 1
      });
    }
  }

  editorRef.focus();
}

function isWrapChar(char) {
  return ['(', '[', '{', '"', "'", '`'].includes(char);
}

function getClosingChar(char) {
  return { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' }[char] || '';
}

// Insertar paréntesis con el cursor en medio
function insertPair(open, close) {
  if (!editorRef) return;
  const selection = editorRef.getSelection();
  const model = editorRef.getModel();
  if (!selection || !model) return;

  // Si hay selección, envolverla
  if (!selection.isEmpty()) {
    const selectedText = model.getValueInRange(selection);
    editorRef.executeEdits('toolbar', [{
      range: selection,
      text: open + selectedText + close,
      forceMoveMarkers: true
    }]);
    editorRef.setPosition({
      lineNumber: selection.endLineNumber,
      column: selection.endColumn + open.length + close.length
    });
    editorRef.focus();
    return;
  }

  // Si no hay selección, insertar el par y poner cursor en el medio
  const pos = selection.getPosition();
  editorRef.executeEdits('toolbar', [{
    range: {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: pos.column
    },
    text: open + close,
    forceMoveMarkers: true
  }]);
  editorRef.setPosition({
    lineNumber: pos.lineNumber,
    column: pos.column + open.length
  });
  editorRef.focus();
}

// Ejecutar comandos nativos del editor
function execEditorCommand(command) {
  if (!editorRef) return;
  editorRef.trigger('toolbar', command, null);
  editorRef.focus();
}

// ============================================================
// CONSTRUCCIÓN DE LA BARRA
// ============================================================
const ROWS = {
  symbols: [
    { label: 'Tab', action: () => insertText('    '), title: 'Indentar 4 espacios' },
    { label: '( )', action: () => insertPair('(', ')'), title: 'Paréntesis' },
    { label: '[ ]', action: () => insertPair('[', ']'), title: 'Corchetes' },
    { label: '{ }', action: () => insertPair('{', '}'), title: 'Llaves' },
    { label: ':', action: () => insertText(':'), title: 'Dos puntos' },
    { label: ',', action: () => insertText(','), title: 'Coma' },
    { label: '.', action: () => insertText('.'), title: 'Punto' },
    { label: '=', action: () => insertText('='), title: 'Igual' },
    { label: '+', action: () => insertText('+'), title: 'Más' },
    { label: '-', action: () => insertText('-'), title: 'Menos' },
    { label: '*', action: () => insertText('*'), title: 'Por' },
    { label: '/', action: () => insertText('/'), title: 'Dividir' },
    { label: '"', action: () => insertText('"'), title: 'Comillas dobles' },
    { label: "'", action: () => insertText("'"), title: 'Comillas simples' },
    { label: '_', action: () => insertText('_'), title: 'Guion bajo' },
    { label: '<', action: () => insertText('<'), title: 'Menor que' },
    { label: '>', action: () => insertText('>'), title: 'Mayor que' },
    { label: '!', action: () => insertText('!'), title: 'Exclamación' },
    { label: '?', action: () => insertText('?'), title: 'Interrogación' },
    { label: '#', action: () => insertText('#'), title: 'Comentario' },
    { label: '&', action: () => insertText('&'), title: 'Ampersand' },
    { label: '|', action: () => insertText('|'), title: 'Pipe' },
    { label: '@', action: () => insertText('@'), title: 'Arroba' },
    { label: '%', action: () => insertText('%'), title: 'Porcentaje' },
    { label: '→', action: () => insertText('->'), title: 'Flecha lambda' },
  ],
  actions: [
    { label: '⌨', action: toggleNativeKeyboard, title: 'Mostrar/ocultar teclado', class: 'accent' },
    { label: '📋', action: pasteFromClipboard, title: 'Pegar', class: 'accent' },
    { label: '↩', action: () => insertText('\n'), title: 'Enter', class: 'accent' },
    { label: '␣', action: () => insertText(' '), title: 'Espacio', class: 'accent' },
    { label: '⇤', action: () => execEditorCommand('deleteLeft'), title: 'Borrar', class: 'accent' },
    { label: '⌦', action: () => execEditorCommand('deleteRight'), title: 'Suprimir', class: 'accent' },
    { label: '↶', action: () => execEditorCommand('undo'), title: 'Deshacer', class: 'accent' },
    { label: '↷', action: () => execEditorCommand('redo'), title: 'Rehacer', class: 'accent' },
    { label: '⇱', action: () => execEditorCommand('cursorHome'), title: 'Inicio de línea', class: 'accent' },
    { label: '⇲', action: () => execEditorCommand('cursorEnd'), title: 'Fin de línea', class: 'accent' },
    { label: '⏮', action: () => execEditorCommand('cursorTop'), title: 'Inicio de archivo', class: 'accent' },
    { label: '⏭', action: () => execEditorCommand('cursorBottom'), title: 'Fin de archivo', class: 'accent' },
    { label: '⤢', action: toggleExtras, title: 'Más snippets', class: 'accent' },
  ],
  extras: [
    { label: 'def', action: () => insertText('def nombre(params):\n    pass\n'), title: 'Función' },
    { label: 'if', action: () => insertText('if condicion:\n    pass\n'), title: 'If' },
    { label: 'for', action: () => insertText('for i in range(10):\n    print(i)\n'), title: 'For' },
    { label: 'while', action: () => insertText('while condicion:\n    pass\n'), title: 'While' },
    { label: 'class', action: () => insertText('class Nombre:\n    def __init__(self):\n        pass\n'), title: 'Clase' },
    { label: 'try', action: () => insertText('try:\n    pass\nexcept Exception as e:\n    print(e)\n'), title: 'Try/except' },
    { label: 'print', action: () => insertText('print()', 6), title: 'Print' },
    { label: 'input', action: () => insertText('await input_async("")', 20), title: 'Input async' },
    { label: 'len', action: () => insertText('len()', 4), title: 'Len' },
    { label: 'range', action: () => insertText('range()', 6), title: 'Range' },
    { label: 'np', action: () => insertText('import numpy as np\n'), title: 'Import numpy' },
    { label: 'pd', action: () => insertText('import pandas as pd\n'), title: 'Import pandas' },
    { label: 'plt', action: () => insertText('import matplotlib.pyplot as plt\n'), title: 'Import matplotlib' },
    { label: 'asy', action: () => insertText('import asyncio\n'), title: 'Import asyncio' },
    { label: '# ', action: insertComment, title: 'Comentar línea' },
    { label: '"""', action: () => insertText('"""\n\n"""'), title: 'Docstring' },
    { label: '__main__', action: () => insertText('if __name__ == "__main__":\n    main()\n'), title: 'Main guard' },
    { label: 'pd.read', action: () => insertText('pd.read_csv("archivo.csv")'), title: 'Leer CSV' },
  ]
};

let extrasVisible = false;

function toggleExtras() {
  extrasVisible = !extrasVisible;
  const extrasRow = toolbarEl?.querySelector('.mt-row-extras');
  if (extrasRow) {
    extrasRow.style.display = extrasVisible ? 'flex' : 'none';
  }
  // Actualizar icono
  const btn = toolbarEl?.querySelector('[data-action="toggle-extras"]');
  if (btn) {
    btn.textContent = extrasVisible ? '⤡' : '⤢';
    btn.title = extrasVisible ? 'Menos snippets' : 'Más snippets';
  }
}

function insertComment() {
  if (!editorRef) return;
  const selection = editorRef.getSelection();
  const model = editorRef.getModel();
  if (!selection || !model) return;

  const startLine = selection.startLineNumber;
  const endLine = selection.endLineNumber;

  const edits = [];
  for (let line = startLine; line <= endLine; line++) {
    const lineContent = model.getLineContent(line);
    const leadingSpaces = lineContent.match(/^\s*/)[0].length;
    edits.push({
      range: {
        startLineNumber: line,
        startColumn: leadingSpaces + 1,
        endLineNumber: line,
        endColumn: leadingSpaces + 1
      },
      text: '# ',
      forceMoveMarkers: true
    });
  }

  editorRef.executeEdits('toolbar', edits);
  editorRef.focus();
}

// ============================================================
// ACCIONES ESPECIALES
// ============================================================
async function pasteFromClipboard() {
  if (!editorRef) return;
  try {
    const text = await navigator.clipboard.readText();
    if (text) insertText(text);
  } catch (e) {
    console.warn('No se pudo leer el portapapeles:', e);
    // Fallback: usar el comando nativo de pegar
    execEditorCommand('editor.action.clipboardPasteAction');
  }
}

// ============================================================
// TECLADO NATIVO: mostrar/ocultar
// ============================================================
let keyboardToggleBtn = null;
let hiddenTextarea = null;

function setupNativeKeyboardToggle() {
  // Creamos un textarea invisible que sirve para invocar el teclado nativo
  hiddenTextarea = document.createElement('textarea');
  hiddenTextarea.setAttribute('autocomplete', 'off');
  hiddenTextarea.setAttribute('autocorrect', 'off');
  hiddenTextarea.setAttribute('autocapitalize', 'off');
  hiddenTextarea.setAttribute('spellcheck', 'false');
  hiddenTextarea.setAttribute('inputmode', 'text');
  hiddenTextarea.style.position = 'fixed';
  hiddenTextarea.style.top = '0';
  hiddenTextarea.style.left = '0';
  hiddenTextarea.style.width = '1px';
  hiddenTextarea.style.height = '1px';
  hiddenTextarea.style.opacity = '0';
  hiddenTextarea.style.pointerEvents = 'none';
  hiddenTextarea.style.fontSize = '16px'; // evita zoom en iOS
  document.body.appendChild(hiddenTextarea);

  // Redirigir la entrada al editor de Monaco
  hiddenTextarea.addEventListener('input', (e) => {
    const text = hiddenTextarea.value;
    if (text) {
      insertText(text);
      hiddenTextarea.value = '';
    }
  });
  hiddenTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      insertText('\n');
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      execEditorCommand('deleteLeft');
      e.preventDefault();
    } else if (e.key === 'Tab') {
      insertText('    ');
      e.preventDefault();
    }
  });
}

function toggleNativeKeyboard() {
  if (!editorRef) return;

  // Verificar si el editor ya tiene el foco y el teclado está abierto
  const hasFocus = editorRef.hasTextFocus();

  if (hasFocus) {
    // Quitar foco → cerrar teclado
    editorRef.blur();
    // En móvil a veces hace falta esto
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  } else {
    // Dar foco al editor → abrir teclado
    editorRef.focus();
  }
}

// ============================================================
// CREAR BARRA EN EL DOM
// ============================================================
function createToolbar() {
  const el = document.createElement('div');
  el.id = 'mobile-toolbar';
  el.className = 'mobile-toolbar';

  // Contenedor interior scrollable horizontalmente
  const scroll = document.createElement('div');
  scroll.className = 'mt-scroll';

  // Fila de símbolos
  const rowSymbols = document.createElement('div');
  rowSymbols.className = 'mt-row mt-row-symbols';
  ROWS.symbols.forEach(item => rowSymbols.appendChild(makeButton(item)));

  // Fila de acciones
  const rowActions = document.createElement('div');
  rowActions.className = 'mt-row mt-row-actions';
  ROWS.actions.forEach(item => rowActions.appendChild(makeButton(item)));

  // Fila de extras (oculta por defecto)
  const rowExtras = document.createElement('div');
  rowExtras.className = 'mt-row mt-row-extras';
  rowExtras.style.display = 'none';
  ROWS.extras.forEach(item => rowExtras.appendChild(makeButton(item)));

  scroll.appendChild(rowSymbols);
  scroll.appendChild(rowActions);
  scroll.appendChild(rowExtras);
  el.appendChild(scroll);

  return el;
}

function makeButton(item) {
  const btn = document.createElement('button');
  btn.className = 'mt-btn' + (item.class ? ' ' + item.class : '');
  btn.textContent = item.label;
  btn.title = item.title || item.label;
  if (item.label === '⤢') btn.dataset.action = 'toggle-extras';

  // Evitar que al pulsar se cierre el teclado
  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

  // Ejecutar la acción
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      item.action();
    } catch (err) {
      console.error('Error en atajo:', err);
    }
  });

  return btn;
}

// ============================================================
// API PÚBLICA
// ============================================================
export function initMobileToolbar(editor) {
  editorRef = editor;
  setupNativeKeyboardToggle();

  // Crear y añadir la barra
  toolbarEl = createToolbar();
  document.body.appendChild(toolbarEl);

  // Mostrar/ocultar según viewport
  updateVisibility();
  window.addEventListener('resize', debounce(updateVisibility, 200));
  window.addEventListener('orientationchange', () => {
    setTimeout(updateVisibility, 300);
  });

  // Añadir padding-bottom al body para que la barra no tape contenido
  updateBodyPadding();

  // Añadir botón en el menú hamburguesa para togglear la barra
  addToolbarToggleToMenu();
}

function updateVisibility() {
  if (!toolbarEl) return;
  const should = shouldShowToolbar();
  toolbarEl.classList.toggle('visible', should);
  document.body.classList.toggle('has-toolbar', should);
  updateBodyPadding();
}

function updateBodyPadding() {
  if (!toolbarEl) return;
  if (shouldShowToolbar()) {
    const h = toolbarEl.offsetHeight || 90;
    document.documentElement.style.setProperty('--toolbar-h', h + 'px');
  } else {
    document.documentElement.style.setProperty('--toolbar-h', '0px');
  }
}

// Botón para activar/desactivar la barra desde el menú
function addToolbarToggleToMenu() {
  const controls = document.getElementById('controls');
  if (!controls) return;

  const btn = document.createElement('button');
  btn.id = 'toggle-toolbar-btn';
  btn.className = 'secondary';
  btn.textContent = '⌨ Barra atajos';
  btn.title = 'Mostrar/ocultar barra de atajos';

  btn.addEventListener('click', () => {
    const enabled = toolbarEl.classList.toggle('user-disabled');
    if (enabled) {
      // Se acaba de desactivar
      toolbarEl.classList.remove('visible');
      document.body.classList.remove('has-toolbar');
      btn.textContent = '⌨ Activar barra';
    } else {
      // Se acaba de activar
      updateVisibility();
      btn.textContent = '⌨ Barra atajos';
    }
  });

  // Añadir al final del menú
  controls.appendChild(btn);
}

// ============================================================
// UTILS
// ============================================================
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}