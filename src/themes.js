// ============================================================
// TEMAS DE MONACO
// ============================================================
// Todos los temas se registran en monaco.editor.defineTheme

export function registerAllThemes(monaco) {

  // ---- Monokai ----
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'regexp', foreground: 'e6db74' },
      { token: 'operator', foreground: 'f92672' },
      { token: 'delimiter', foreground: 'f8f8f2' },
      { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
      { token: 'identifier', foreground: 'f8f8f2' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'ae81ff' },
      { token: 'tag', foreground: 'f92672' },
      { token: 'attribute.name', foreground: 'a6e22e' },
      { token: 'attribute.value', foreground: 'e6db74' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#90908a',
      'editorLineNumber.activeForeground': '#c2c2bf',
      'editor.selectionBackground': '#49483e',
      'editor.inactiveSelectionBackground': '#3e3d32',
      'editor.lineHighlightBackground': '#3e3d32',
      'editorCursor.foreground': '#f8f8f0',
      'editorWhitespace.foreground': '#464741',
      'editorIndentGuide.background': '#464741',
      'editorIndentGuide.activeBackground': '#767771',
      'editorBracketMatch.background': '#3e3d32',
      'editorBracketMatch.border': '#f8f8f2',
      'editorGutter.background': '#272822',
      'editorWidget.background': '#1e1f1c',
      'editorSuggestWidget.background': '#1e1f1c',
      'editorSuggestWidget.selectedBackground': '#49483e',
    }
  });

  // ---- Dracula ----
  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
      { token: 'function', foreground: '50fa7b' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'bd93f9' },
      { token: 'operator', foreground: 'ff79c6' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#6272a4',
      'editorLineNumber.activeForeground': '#f8f8f2',
      'editor.selectionBackground': '#44475a',
      'editor.lineHighlightBackground': '#44475a75',
      'editorCursor.foreground': '#f8f8f0',
      'editorIndentGuide.background': '#44475a',
      'editorWidget.background': '#21222c',
      'editorSuggestWidget.background': '#21222c',
      'editorSuggestWidget.selectedBackground': '#44475a',
    }
  });

  // ---- GitHub Dark ----
  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'ffa657' },
      { token: 'constant', foreground: '79c0ff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#c9d1d9',
      'editor.selectionBackground': '#264f78',
      'editor.lineHighlightBackground': '#161b22',
      'editorCursor.foreground': '#58a6ff',
      'editorWidget.background': '#161b22',
      'editorSuggestWidget.background': '#161b22',
      'editorSuggestWidget.selectedBackground': '#1f6feb33',
    }
  });

  // ---- Solarized Dark ----
  monaco.editor.defineTheme('solarized-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'type', foreground: 'b58900' },
      { token: 'function', foreground: '268bd2' },
      { token: 'variable', foreground: '839496' },
      { token: 'constant', foreground: 'cb4b16' },
    ],
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editorLineNumber.foreground': '#586e75',
      'editorLineNumber.activeForeground': '#93a1a1',
      'editor.selectionBackground': '#073642',
      'editor.lineHighlightBackground': '#073642',
      'editorCursor.foreground': '#839496',
      'editorWidget.background': '#073642',
      'editorSuggestWidget.background': '#073642',
    }
  });

  // ---- Nord ----
  monaco.editor.defineTheme('nord', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'type', foreground: '8fbcbb' },
      { token: 'function', foreground: '88c0d0' },
      { token: 'variable', foreground: 'd8dee9' },
      { token: 'constant', foreground: 'b48ead' },
    ],
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editorLineNumber.foreground': '#4c566a',
      'editorLineNumber.activeForeground': '#d8dee9',
      'editor.selectionBackground': '#434c5e',
      'editor.lineHighlightBackground': '#3b4252',
      'editorCursor.foreground': '#d8dee9',
      'editorWidget.background': '#3b4252',
      'editorSuggestWidget.background': '#3b4252',
    }
  });

  // ---- One Dark ----
  monaco.editor.defineTheme('one-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
      { token: 'variable', foreground: 'e06c75' },
      { token: 'constant', foreground: 'd19a66' },
    ],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editorLineNumber.foreground': '#495162',
      'editorLineNumber.activeForeground': '#abb2bf',
      'editor.selectionBackground': '#3e4451',
      'editor.lineHighlightBackground': '#2c313c',
      'editorCursor.foreground': '#528bff',
      'editorWidget.background': '#21252b',
      'editorSuggestWidget.background': '#21252b',
      'editorSuggestWidget.selectedBackground': '#2c313c',
    }
  });

  // ---- Material Dark ----
  monaco.editor.defineTheme('material-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '546e7a', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'type', foreground: 'ffcb6b' },
      { token: 'function', foreground: '82aaff' },
      { token: 'variable', foreground: 'eeffff' },
      { token: 'constant', foreground: 'f78c6c' },
    ],
    colors: {
      'editor.background': '#263238',
      'editor.foreground': '#eeffff',
      'editorLineNumber.foreground': '#546e7a',
      'editorLineNumber.activeForeground': '#eeffff',
      'editor.selectionBackground': '#314549',
      'editor.lineHighlightBackground': '#2a373e',
      'editorCursor.foreground': '#ffcc00',
      'editorWidget.background': '#1e272c',
      'editorSuggestWidget.background': '#1e272c',
      'editorSuggestWidget.selectedBackground': '#314549',
    }
  });
}

// Temas que usan base CLARA (para aplicar la UI clara)
export const LIGHT_THEMES = ['vs', 'vs-light'];

// Guardar/leer tema de localStorage
export function loadSavedTheme() {
  return localStorage.getItem('pyeditor_theme') || 'vs-dark';
}

export function saveTheme(theme) {
  try { localStorage.setItem('pyeditor_theme', theme); } catch (e) {}
}

// Aplicar clase de UI clara/oscura según tema de Monaco
export function applyUITone(theme) {
  const isLight = LIGHT_THEMES.includes(theme);
  document.body.dataset.theme = isLight ? 'light' : 'dark';
}