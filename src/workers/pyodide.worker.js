// ⚠️ WORKER CLÁSICO — NO usar import/export aquí
// Este archivo se importa con ?raw en el bridge y se carga desde un Blob.

importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js');

var pyodide = null;
var projectPath = '/home/pyodide/project';
var pendingInputResolve = null;

self.onmessage = async function(e) {
  var type = e.data.type;
  var payload = e.data.payload;
  switch (type) {
    case 'init': await initPyodide(); break;
    case 'run': await runCode(payload); break;
    case 'load-package': await loadPackage(payload); break;
    case 'input-response':
      if (pendingInputResolve) {
        var r = pendingInputResolve;
        pendingInputResolve = null;
        r(payload.value);
      }
      break;
  }
};

function post(type, data) {
  self.postMessage(Object.assign({ type: type }, data));
}

async function initPyodide() {
  try {
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
    });
    pyodide.setStdout({ batched: function(m) { post('stdout', { text: m + '\n' }); } });
    pyodide.setStderr({ batched: function(m) { post('stderr', { text: m + '\n' }); } });

    pyodide.globals.set('js_input_async', function(promptText) {
      return new Promise(function(resolve) {
        pendingInputResolve = resolve;
        post('input-request', { prompt: String(promptText || '') });
      });
    });

    await pyodide.runPythonAsync(`
import builtins, sys, os

async def input_async(prompt=""):
    return await js_input_async(str(prompt))

builtins.input_async = input_async

if not os.path.exists('${projectPath}'):
    os.makedirs('${projectPath}', exist_ok=True)
if '${projectPath}' not in sys.path:
    sys.path.insert(0, '${projectPath}')
    `);

    await pyodide.loadPackage('matplotlib');
    await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('module://matplotlib_pyodide.wasm_backend')
import io

def _show_svg(svg_str):
    __emit_svg(svg_str)

import matplotlib.pyplot as plt
def _inline_show(*args, **kwargs):
    fig = plt.gcf()
    buf = io.StringIO()
    fig.savefig(buf, format='svg', bbox_inches='tight')
    _show_svg(buf.getvalue())
    plt.close(fig)
plt.show = _inline_show
    `);

    pyodide.globals.set('__emit_svg', function(svg) {
      post('svg', { svg: String(svg) });
    });

    post('ready', {});
  } catch (err) {
    post('init-error', { error: err.message || String(err) });
  }
}

async function loadPackage(pkg) {
  try {
    await pyodide.loadPackage(pkg);
    post('package-loaded', { pkg: pkg });
  } catch (err) {
    post('package-error', { pkg: pkg, error: err.message || String(err) });
  }
}

async function runCode(payload) {
  var code = payload.code;
  var files = payload.files;
  try {
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var fullPath = projectPath + '/' + f.name;
      var dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      if (!pyodide.FS.analyzePath(dir).exists) pyodide.FS.mkdirTree(dir);
      pyodide.FS.writeFile(fullPath, f.content);
    }

    pyodide.runPython(`
import importlib, sys
for mod in list(sys.modules.keys()):
    if mod != '__main__' and hasattr(sys.modules[mod], '__file__'):
        f = getattr(sys.modules[mod], '__file__', '') or ''
        if 'project' in f:
            del sys.modules[mod]
importlib.invalidate_caches()
    `);

    pyodide.runPython(`
import os
os.chdir('${projectPath}')
    `);

    var start = performance.now();
    post('run-start', {});
    await pyodide.runPythonAsync(code);
    post('run-end', { elapsed: performance.now() - start });
  } catch (err) {
    post('run-error', { error: err.message || String(err) });
  }
}