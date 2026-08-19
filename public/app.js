const cameraInput = document.getElementById('cameraInput');
const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const totalsEl = document.getElementById('totals');
const notesEl = document.getElementById('notes');
const itemsEl = document.getElementById('items');

let currentImage = null; // { base64, mediaType }

function showStatus(message, isError = false) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function hideStatus() {
  statusEl.hidden = true;
  statusEl.textContent = '';
}

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const [header, base64] = dataUrl.split(',');
    const mediaType = header.match(/data:(.*);base64/)[1];

    currentImage = { base64, mediaType };
    previewImg.src = dataUrl;
    previewImg.hidden = false;
    previewPlaceholder.hidden = true;
    analyzeBtn.disabled = false;

    resultsEl.hidden = true;
    hideStatus();
  };
  reader.readAsDataURL(file);
}

cameraInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

function renderResults(data) {
  const totals = data.totals || {};
  totalsEl.innerHTML = `
    <div class="total-card calories">
      <div class="value">${Math.round(totals.calories ?? 0)}</div>
      <div class="label">Calorías (kcal)</div>
    </div>
    <div class="total-card protein">
      <div class="value">${Math.round(totals.protein_g ?? 0)} g</div>
      <div class="label">Proteína</div>
    </div>
    <div class="total-card carbs">
      <div class="value">${Math.round(totals.carbs_g ?? 0)} g</div>
      <div class="label">Carbohidratos</div>
    </div>
    <div class="total-card fat">
      <div class="value">${Math.round(totals.fat_g ?? 0)} g</div>
      <div class="label">Grasa</div>
    </div>
  `;

  notesEl.textContent = data.notes
    ? `${data.notes}${data.confidence ? ` (confianza: ${data.confidence})` : ''}`
    : '';
  notesEl.hidden = !data.notes;

  const items = data.items || [];
  itemsEl.innerHTML = items.length
    ? items.map((item) => `
        <div class="item-card">
          <div class="item-header">
            <span class="item-name">${item.name}</span>
            <span class="item-portion">${item.portion ?? ''}</span>
          </div>
          <div class="item-macros">
            <span><b>${Math.round(item.calories ?? 0)}</b> kcal</span>
            <span>Prot <b>${Math.round(item.protein_g ?? 0)}</b> g</span>
            <span>Carb <b>${Math.round(item.carbs_g ?? 0)}</b> g</span>
            <span>Grasa <b>${Math.round(item.fat_g ?? 0)}</b> g</span>
          </div>
        </div>
      `).join('')
    : '<p style="color: var(--muted)">No se detectaron alimentos claros en la imagen.</p>';

  resultsEl.hidden = false;
}

analyzeBtn.addEventListener('click', async () => {
  if (!currentImage) return;

  analyzeBtn.disabled = true;
  resultsEl.hidden = true;
  showStatus('Analizando tu comida...');

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: currentImage.base64,
        mediaType: currentImage.mediaType
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Ocurrió un error al analizar la imagen.');
    }

    hideStatus();
    renderResults(data);
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    analyzeBtn.disabled = false;
  }
});
