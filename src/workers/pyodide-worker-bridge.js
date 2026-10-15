// 🔑 Cargar el código del worker como TEXTO crudo (no como módulo)
import workerCode from './pyodide.worker.js?raw';

export function initPyodideWorker(callbacks) {
  // Crear Blob y Worker CLÁSICO explícitamente
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);  // ← Worker CLÁSICO (no module)

  worker.onmessage = (e) => {
    const { type } = e.data;
    switch (type) {
      case 'ready': callbacks.onReady?.(); break;
      case 'init-error': callbacks.onInitError?.(e.data.error); break;
      case 'stdout': callbacks.onStdout?.(e.data.text); break;
      case 'stderr': callbacks.onStderr?.(e.data.text); break;
      case 'svg': callbacks.onSVG?.(e.data.svg); break;
      case 'input-request': callbacks.onInputRequest?.(e.data.prompt, api); break;
      case 'run-start': callbacks.onRunStart?.(); break;
      case 'run-end': callbacks.onRunEnd?.(e.data.elapsed); break;
      case 'run-error': callbacks.onRunError?.(e.data.error); break;
      case 'package-loaded': callbacks.onPackageLoaded?.(e.data.pkg); break;
      case 'package-error': callbacks.onPackageError?.(e.data.pkg, e.data.error); break;
    }
  };

  worker.onerror = (e) => {
    console.error('Worker error:', e);
    callbacks.onInitError?.(e.message || 'Error en el worker');
  };

  const api = {
    run: (code, files) => worker.postMessage({ type: 'run', payload: { code, files } }),
    loadPackage: (pkg) => worker.postMessage({ type: 'load-package', payload: pkg }),
    sendInput: (value) => worker.postMessage({ type: 'input-response', payload: { value } }),
    terminate: () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    }
  };

  worker.postMessage({ type: 'init' });
  return api;
}