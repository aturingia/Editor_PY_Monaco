import { CLOUD_CONFIG } from './config.js';
import { exportProjectAsZip } from './zip.js';
import { showToast } from './main.js';

export function initCloudHandlers() {
  const modal = document.getElementById('cloud-export-modal');
  const status = document.getElementById('cloud-status');
  const warning = document.getElementById('cloud-config-warning');

  document.getElementById('cloud-export-trigger').addEventListener('click', () => {
    const gConfigured = !!CLOUD_CONFIG.googleDrive.clientId;
    const dConfigured = !!CLOUD_CONFIG.dropbox.appKey;
    warning.style.display = (!gConfigured && !dConfigured) ? 'block' : 'none';
    status.textContent = '';
    modal.classList.add('active');
  });

  document.getElementById('cloud-close').addEventListener('click', () => modal.classList.remove('active'));

  document.getElementById('export-gdrive').addEventListener('click', async () => {
    status.textContent = '📁 Generando ZIP...';
    status.style.color = '#dcdcaa';
    try {
      await exportProjectAsZip();
      status.textContent = '✅ ZIP descargado. Súbelo manualmente a Google Drive.';
      status.style.color = '#4ec9b0';
      showToast('📁 ZIP listo para Drive', 'info');
    } catch (err) {
      status.textContent = '✗ ' + err.message;
      status.style.color = '#f48771';
    }
  });

  document.getElementById('export-dropbox').addEventListener('click', async () => {
    status.textContent = '📦 Generando ZIP...';
    status.style.color = '#dcdcaa';
    try {
      await exportProjectAsZip();
      status.textContent = '✅ ZIP descargado. Súbelo manualmente a Dropbox.';
      status.style.color = '#4ec9b0';
      showToast('📦 ZIP listo para Dropbox', 'info');
    } catch (err) {
      status.textContent = '✗ ' + err.message;
      status.style.color = '#f48771';
    }
  });
}