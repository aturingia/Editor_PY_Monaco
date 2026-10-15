import { syncActiveContent, scheduleSave, state } from './files.js';
import { registerAllThemes, loadSavedTheme, saveTheme, applyUITone } from './themes.js';

let currentMonaco = null;
let currentEditor = null;

export async function initEditor(monaco) {
  currentMonaco = monaco;

  // Registrar todos los temas personalizados
  registerAllThemes(monaco);

  const container = document.getElementById('editor-container');
  const active = state.files.find(f => f.id === state.activeId);

  const theme = loadSavedTheme();
  applyUITone(theme);

  // Detección de móvil para ajustar opciones
  const isMobile = window.matchMedia('(max-width: 767px)').matches ||
                   ('ontouchstart' in window && window.innerWidth < 900);

  const editor = monaco.editor.create(container, {
    value: active?.content || '',
    language: 'python',
    theme: theme,
    fontSize: isMobile ? 13 : 14,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    minimap: { enabled: !isMobile },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'on',
    smoothScrolling: true,
    padding: { top: isMobile ? 8 : 12, bottom: isMobile ? 8 : 12 },
    quickSuggestions: { other: true, comments: false, strings: false },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: isMobile ? 'off' : 'on', // en móvil mejor desactivado
    tabCompletion: 'on',
    parameterHints: { enabled: true },
    suggest: {
      showMethods: true,
      showFunctions: true,
      showVariables: true,
      showKeywords: true,
      showSnippets: true
    },
    // Mejor experiencia táctil
    mouseWheelZoom: !isMobile,
    lineNumbersMinChars: isMobile ? 3 : 5,
    folding: !isMobile,
    glyphMargin: false,
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    // Accesibilidad
    accessibilitySupport: 'auto',
    // Longitud de línea para plegado
    wordWrapColumn: 120,
    wrappingIndent: 'indent',
    // Mantener el cursor visible al escribir con la barra táctil
    scrollBeyondLastLine: false,
    // (Añade las siguientes líneas)
    cursorSurroundingLines: 3,
    cursorSurroundingLinesStyle: 'default',
  });

  currentEditor = editor;

  registerPythonCompletions(monaco);
  registerPythonHover(monaco);

  editor.onDidChangeModelContent(() => scheduleSave());
  editor.onDidBlurEditorText(() => syncActiveContent());

  // Cambio de tema desde el selector
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
    themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }

  // Detectar cambios de tamaño (rotación) para reajustar opciones
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateEditorForViewport();
    }, 200);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      editor.layout();
      updateEditorForViewport();
    }, 300);
  });
  // Asegurar que el cursor quede visible al escribir
  if (isMobile) {
    currentEditor.updateOptions({
      cursorSurroundingLines: 3,
    });
  }

  return editor;
}

export function setTheme(themeName) {
  if (!currentMonaco || !currentEditor) return;
  currentMonaco.editor.setTheme(themeName);
  saveTheme(themeName);
  applyUITone(themeName);
}

function updateEditorForViewport() {
  if (!currentEditor) return;
  const isMobile = window.matchMedia('(max-width: 767px)').matches ||
                   window.innerWidth < 768;
  currentEditor.updateOptions({
    minimap: { enabled: !isMobile },
    fontSize: isMobile ? 13 : 14,
    padding: { top: isMobile ? 8 : 12, bottom: isMobile ? 8 : 12 },
    lineNumbersMinChars: isMobile ? 3 : 5,
    folding: !isMobile,
    acceptSuggestionOnEnter: isMobile ? 'off' : 'on',
  });
  currentEditor.layout();
}

// ============================================================
// AUTOCOMPLETADO
// ============================================================
function registerPythonCompletions(monaco) {
  const snippets = [
    { label: 'print', detail: 'Imprime en consola', insertText: 'print(${1})', kind: monaco.languages.CompletionItemKind.Function },
    { label: 'len', detail: 'Longitud', insertText: 'len(${1})', kind: monaco.languages.CompletionItemKind.Function },
    { label: 'range', detail: 'Rango', insertText: 'range(${1})', kind: monaco.languages.CompletionItemKind.Function },
    { label: 'input_async', detail: 'Input async (usar con await)', insertText: 'await input_async("${1:prompt: }")', kind: monaco.languages.CompletionItemKind.Function },
    { label: 'def', detail: 'Función', insertText: 'def ${1:nombre}(${2}):\n    ${3:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'async def', detail: 'Función async', insertText: 'async def ${1:nombre}(${2}):\n    ${3:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'class', detail: 'Clase', insertText: 'class ${1:Nombre}:\n    def __init__(self${2}):\n        ${3:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'if', detail: 'Condicional', insertText: 'if ${1:condicion}:\n    ${2:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'for', detail: 'Bucle for', insertText: 'for ${1:i} in ${2:iterable}:\n    ${3:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'while', detail: 'Bucle while', insertText: 'while ${1:condicion}:\n    ${2:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'try', detail: 'Try/except', insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'with', detail: 'Context manager', insertText: 'with ${1:recurso} as ${2:var}:\n    ${3:pass}', kind: monaco.languages.CompletionItemKind.Keyword, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
    { label: 'import', detail: 'Importar', insertText: 'import ${1:modulo}', kind: monaco.languages.CompletionItemKind.Keyword },
    { label: 'from', detail: 'Importar desde', insertText: 'from ${1:modulo} import ${2:nombre}', kind: monaco.languages.CompletionItemKind.Keyword },
    { label: 'numpy import', detail: 'import numpy as np', insertText: 'import numpy as np', kind: monaco.languages.CompletionItemKind.Module },
    { label: 'pandas import', detail: 'import pandas as pd', insertText: 'import pandas as pd', kind: monaco.languages.CompletionItemKind.Module },
    { label: 'matplotlib import', detail: 'import matplotlib.pyplot as plt', insertText: 'import matplotlib.pyplot as plt', kind: monaco.languages.CompletionItemKind.Module },
    { label: 'asyncio import', detail: 'import asyncio', insertText: 'import asyncio', kind: monaco.languages.CompletionItemKind.Module },
  ];

  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = snippets.map(s => ({
        label: s.label,
        kind: s.kind,
        detail: s.detail,
        insertText: s.insertText,
        insertTextRules: s.insertTextRules,
        range
      }));

      // Variables definidas
      const text = model.getValue();
      const varRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
      const vars = new Set();
      let m;
      while ((m = varRegex.exec(text)) !== null) {
        if (!['if', 'else', 'elif', 'for', 'while', 'return', 'yield'].includes(m[1])) {
          vars.add(m[1]);
        }
      }
      vars.forEach(v => {
        suggestions.push({
          label: v,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: 'variable',
          insertText: v,
          range
        });
      });

      return { suggestions };
    }
  });
}

function registerPythonHover(monaco) {
  const docs = {
    print: 'print(*objects, sep=" ", end="\\n") — Imprime en stdout.',
    len: 'len(obj) — Longitud del objeto.',
    range: 'range(stop) / range(start, stop[, step]) — Secuencia de números.',
    input_async: 'await input_async(prompt) — Entrada sin bloquear la UI.',
    def: 'def nombre(params): — Define una función.',
    class: 'class Nombre: — Define una clase.',
    async: 'async def — Corrutina ejecutable con await.'
  };

  monaco.languages.registerHoverProvider('python', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const doc = docs[word.word];
      if (!doc) return null;
      return {
        range: new monaco.Range(
          position.lineNumber, word.startColumn,
          position.lineNumber, word.endColumn
        ),
        contents: [{ value: '**' + word.word + '**' }, { value: doc }]
      };
    }
  });
}