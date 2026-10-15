import { generateUniqueName } from './files.js';

export function showConflictDialog(conflicts) {
  return new Promise((resolve) => {
    const modal = document.getElementById('conflict-modal');
    const listEl = document.getElementById('conflict-list');
    const countEl = document.getElementById('conflict-count');
    const filenameEl = document.getElementById('conflict-filename');
    const diffOldEl = document.getElementById('diff-old');
    const diffNewEl = document.getElementById('diff-new');
    const actReplace = document.getElementById('act-replace');
    const actRename = document.getElementById('act-rename');
    const actSkip = document.getElementById('act-skip');

    const decisions = conflicts.map(c => ({
      name: c.name,
      oldContent: c.oldContent,
      newContent: c.newContent,
      action: 'replace',
      newName: null,
      selected: true
    }));

    let activeIdx = 0;

    function renderList() {
      listEl.innerHTML = '';
      decisions.forEach((d, idx) => {
        const item = document.createElement('div');
        item.className = 'conflict-item' + (idx === activeIdx ? ' active' : '');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = d.selected;
        cb.addEventListener('change', (e) => { d.selected = e.target.checked; });
        cb.addEventListener('click', (e) => e.stopPropagation());

        const name = document.createElement('span');
        name.className = 'item-name';
        name.textContent = d.name;
        name.title = d.name;

        const badge = document.createElement('span');
        badge.className = 'item-badge ' + d.action;
        badge.textContent = d.action === 'replace' ? 'REEMP' : d.action === 'rename' ? 'RENOM' : 'SALTAR';

        item.appendChild(cb);
        item.appendChild(name);
        item.appendChild(badge);

        item.addEventListener('click', () => {
          activeIdx = idx;
          renderList();
          renderDetail();
        });

        listEl.appendChild(item);
      });
      countEl.textContent = decisions.length;
    }

    function renderDetail() {
      const d = decisions[activeIdx];
      if (!d) return;
      filenameEl.textContent = d.name;
      [actReplace, actRename, actSkip].forEach(b => b.classList.remove('active'));
      if (d.action === 'replace') actReplace.classList.add('active');
      if (d.action === 'rename') actRename.classList.add('active');
      if (d.action === 'skip') actSkip.classList.add('active');
      renderDiff(d.oldContent, d.newContent, diffOldEl, diffNewEl);
    }

    function renderDiff(oldText, newText, elOld, elNew) {
      const oldLines = oldText.split('\n');
      const newLines = newText.split('\n');
      const lcs = computeLCS(oldLines, newLines);

      elOld.innerHTML = '';
      elNew.innerHTML = '';

      let i = 0, j = 0, k = 0;
      while (i < oldLines.length || j < newLines.length) {
        if (k < lcs.length && i < oldLines.length && oldLines[i] === lcs[k] &&
            j < newLines.length && newLines[j] === lcs[k]) {
          elOld.appendChild(makeLine(oldLines[i], 'same'));
          elNew.appendChild(makeLine(newLines[j], 'same'));
          i++; j++; k++;
        } else {
          if (i < oldLines.length) { elOld.appendChild(makeLine(oldLines[i], 'removed')); i++; }
          if (j < newLines.length) { elNew.appendChild(makeLine(newLines[j], 'added')); j++; }
        }
      }

      if (!oldLines.length || (oldLines.length === 1 && !oldLines[0]))
        elOld.innerHTML = '<span class="diff-line empty">(vacío)</span>';
      if (!newLines.length || (newLines.length === 1 && !newLines[0]))
        elNew.innerHTML = '<span class="diff-line empty">(vacío)</span>';
    }

    function makeLine(text, cls) {
      const span = document.createElement('span');
      span.className = 'diff-line ' + cls;
      span.textContent = text + '\n';
      return span;
    }

    function computeLCS(a, b) {
      const m = a.length, n = b.length;
      if (m * n > 100000) return [];
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
          dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
      const result = [];
      let i = m, j = n;
      while (i > 0 && j > 0) {
        if (a[i-1] === b[j-1]) { result.unshift(a[i-1]); i--; j--; }
        else if (dp[i-1][j] > dp[i][j-1]) i--;
        else j--;
      }
      return result;
    }

    actReplace.addEventListener('click', () => {
      decisions[activeIdx].action = 'replace';
      decisions[activeIdx].newName = null;
      renderList(); renderDetail();
    });

    actRename.addEventListener('click', () => {
      const d = decisions[activeIdx];
      const suggested = generateUniqueName(d.name);
      const newName = prompt(`Nuevo nombre para "${d.name}":`, suggested);
      if (newName && newName.trim() && newName !== d.name) {
        d.action = 'rename';
        d.newName = newName.trim();
        d.name = newName.trim();
        renderList(); renderDetail();
      }
    });

    actSkip.addEventListener('click', () => {
      decisions[activeIdx].action = 'skip';
      renderList(); renderDetail();
    });

    document.getElementById('conflict-all-replace').addEventListener('click', () => {
      decisions.forEach(d => { d.action = 'replace'; d.selected = true; });
      renderList(); renderDetail();
    });

    document.getElementById('conflict-all-skip').addEventListener('click', () => {
      decisions.forEach(d => { d.action = 'skip'; d.selected = true; });
      renderList(); renderDetail();
    });

    document.getElementById('conflict-apply').addEventListener('click', () => {
      const result = decisions.filter(d => d.selected).map(d => ({
        name: d.name, action: d.action, newName: d.newName, content: d.newContent
      }));
      cleanup();
      resolve(result);
    });

    document.getElementById('conflict-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    function cleanup() { modal.classList.remove('active'); }

    const escHandler = (e) => {
      if (e.key === 'Escape') { cleanup(); resolve(null); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    modal.classList.add('active');
    renderList();
    renderDetail();
  });
}