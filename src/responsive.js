// ============================================================
// LAYOUT RESPONSIVO + SPLITTER + MENÚ MÓVIL
// ============================================================

const MOBILE_BREAKPOINT = 767;

export function initResponsive() {
  setupMenuToggle();
  setupSplitter();
  setupOrientationHandling();
  applyInitialLayout();
}

// ============================================================
// MENÚ HAMBURGUESA (móvil)
// ============================================================
function setupMenuToggle() {
  const toggle = document.getElementById('menu-toggle');
  const controls = document.getElementById('controls');
  if (!toggle || !controls) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    controls.classList.toggle('open');
    toggle.textContent = controls.classList.contains('open') ? '✕' : '☰';
  });

  // Cerrar al pulsar un botón del menú (excepto selects)
  controls.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && window.innerWidth <= MOBILE_BREAKPOINT) {
      controls.classList.remove('open');
      toggle.textContent = '☰';
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!controls.classList.contains('open')) return;
    if (controls.contains(e.target) || toggle.contains(e.target)) return;
    controls.classList.remove('open');
    toggle.textContent = '☰';
  });
}

// ============================================================
// SPLITTER (redimensionar editor/consola)
// ============================================================
function setupSplitter() {
  const splitter = document.getElementById('splitter');
  const editorCont = document.getElementById('editor-container');
  const outputCont = document.getElementById('output-container');
  const main = document.getElementById('main');
  if (!splitter || !editorCont || !outputCont || !main) return;

  let dragging = false;

  const isVertical = () => {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches ||
           window.matchMedia('(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)').matches;
  };

  const getClientPos = (e) => {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const startDrag = (e) => {
    dragging = true;
    splitter.classList.add('dragging');
    document.body.style.cursor = isVertical() ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const onDrag = (e) => {
    if (!dragging) return;
    const { x, y } = getClientPos(e);
    const rect = main.getBoundingClientRect();

    if (isVertical()) {
      // Editor arriba, consola abajo → mover en eje Y
      const relY = y - rect.top;
      const pct = Math.max(20, Math.min(80, (relY / rect.height) * 100));
      editorCont.style.flex = `0 0 ${pct}%`;
      outputCont.style.flex = `0 0 ${100 - pct}%`;
    } else {
      // Editor izquierda, consola derecha → mover en eje X
      const relX = x - rect.left;
      const pct = Math.max(20, Math.min(80, (relX / rect.width) * 100));
      editorCont.style.flex = `0 0 ${pct}%`;
      outputCont.style.flex = `0 0 ${100 - pct}%`;
    }

    window.dispatchEvent(new Event('resize'));
  };

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Mouse
  splitter.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);

  // Touch
  splitter.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('touchend', endDrag);
  document.addEventListener('touchcancel', endDrag);

  // Reset al cambiar de layout
  window.addEventListener('resize', () => {
    // Si no hay dragging activo, no tocamos
  });
}

// ============================================================
// ORIENTACIÓN / BREAKPOINTS
// ============================================================
function applyInitialLayout() {
  const body = document.body;
  const width = window.innerWidth;
  const isMobile = width <= MOBILE_BREAKPOINT;
  const isTabletPortrait = window.matchMedia('(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)').matches;

  if (isMobile || isTabletPortrait) {
    body.dataset.layout = 'stacked';
  } else {
    body.dataset.layout = 'side-by-side';
  }

  // Ocultar splitter horizontal en desktop si se quedó como col
  updateSplitterCursor();
}

function updateSplitterCursor() {
  const splitter = document.getElementById('splitter');
  if (!splitter) return;
  const isVertical = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches ||
                     window.matchMedia('(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)').matches;
  splitter.style.cursor = isVertical ? 'row-resize' : 'col-resize';
}

function setupOrientationHandling() {
  let lastWidth = window.innerWidth;

  const handleChange = () => {
    const newWidth = window.innerWidth;
    const crossed = (lastWidth <= MOBILE_BREAKPOINT) !== (newWidth <= MOBILE_BREAKPOINT);
    lastWidth = newWidth;

    if (crossed) {
      // Resetear flex inline al cambiar de modo
      const ec = document.getElementById('editor-container');
      const oc = document.getElementById('output-container');
      if (ec) ec.style.flex = '';
      if (oc) oc.style.flex = '';
    }

    applyInitialLayout();

    // Cerrar menú móvil al cambiar de layout
    const controls = document.getElementById('controls');
    const toggle = document.getElementById('menu-toggle');
    if (controls && toggle) {
      controls.classList.remove('open');
      toggle.textContent = '☰';
    }
  };

  window.addEventListener('resize', debounce(handleChange, 150));
  window.addEventListener('orientationchange', () => {
    setTimeout(handleChange, 250);
  });
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