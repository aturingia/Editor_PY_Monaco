let onImportCallback = null;

export function initDropzone({ importFiles }) {
  onImportCallback = importFiles;
  const tabsBar = document.getElementById('tabs-bar');
  const overlay = document.getElementById('drop-overlay');
  let dragCounter = 0;

  tabsBar.addEventListener('dragenter', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) tabsBar.classList.add('drag-over');
  });
  tabsBar.addEventListener('dragover', (e) => {
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  });
  tabsBar.addEventListener('dragleave', (e) => {
    e.preventDefault(); e.stopPropagation();
    tabsBar.classList.remove('drag-over');
  });
  tabsBar.addEventListener('drop', async (e) => {
    e.preventDefault(); e.stopPropagation();
    tabsBar.classList.remove('drag-over');
    const files = await readDroppedFiles(e.dataTransfer);
    onImportCallback(files);
  });

  window.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    if (e.target.closest('#tabs-bar')) return;
    dragCounter++;
    if (dragCounter === 1) overlay.classList.add('active');
  });
  window.addEventListener('dragleave', (e) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    dragCounter--;
    if (dragCounter <= 0) { dragCounter = 0; overlay.classList.remove('active'); }
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    if (e.target.closest('#tabs-bar')) return;
    e.preventDefault(); e.stopPropagation();
    dragCounter = 0;
    overlay.classList.remove('active');
    const files = await readDroppedFiles(e.dataTransfer);
    onImportCallback(files);
  });

  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
}

async function readDroppedFiles(dataTransfer) {
  const items = dataTransfer.items;
  const files = [];

  if (!items || !items.length) {
    for (const file of dataTransfer.files) files.push({ file, path: file.name });
    return files;
  }

  const entries = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (entry) entries.push(entry);
  }

  const results = await Promise.all(entries.map(e => traverseEntry(e, '')));
  results.forEach(arr => files.push(...arr));
  return files;
}

function traverseEntry(entry, path) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file(f => resolve([{ file: f, path: path + f.name }]), () => resolve([]));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const allEntries = [];
      const readBatch = () => {
        reader.readEntries(async (batch) => {
          if (batch.length === 0) {
            const subResults = await Promise.all(
              allEntries.map(sub => traverseEntry(sub, path + entry.name + '/'))
            );
            resolve(subResults.flat());
          } else {
            allEntries.push(...batch);
            readBatch();
          }
        }, () => resolve([]));
      };
      readBatch();
    } else resolve([]);
  });
}