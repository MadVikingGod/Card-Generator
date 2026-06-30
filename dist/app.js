const STORAGE_KEY = 'card-generator-cards';
const BACK_STORAGE_KEY = 'card-generator-backs';

let cards = [];
let selectedCardId = null;
let cardBacks = {};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createDefaultCard() {
  return {
    id: generateId(),
    name: 'New Card',
    rarity: 'common',
    type: '',
    color: '#3b82f6',
    image: null,
    weakness: '',
    strength: '',
    powers: [
      { name: '', value: 0 },
      { name: '', value: 0 },
      { name: '', value: 0 },
      { name: '', value: 0 },
    ],
    help: 100,
    copies: 1,
    backImage: null,
    backColor: '#1e3a5f',
    backText: '',
  };
}

function saveCards() {
  const saveData = cards.map(c => ({
    ...c,
    image: c.image ? c.image.substring(0, 500000) : null,
    backImage: c.backImage ? c.backImage.substring(0, 500000) : null,
  }));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.warn('Storage full, saving without images');
    const lite = cards.map(c => ({ ...c, image: null, backImage: null }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lite));
  }
}

function loadCards() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      cards = JSON.parse(data);
      cards.forEach(c => {
        if (!c.powers) c.powers = [{ name: '', value: 0 }, { name: '', value: 0 }, { name: '', value: 0 }, { name: '', value: 0 }];
        if (c.help === undefined) c.help = 100;
        if (c.copies === undefined) c.copies = 1;
        if (c.backColor === undefined) c.backColor = '#1e3a5f';
        if (c.backText === undefined) c.backText = '';
      });
    }
  } catch (e) {
    console.warn('Failed to load cards', e);
  }
}

function renderCardList() {
  const list = document.getElementById('card-list');
  list.innerHTML = '';
  cards.forEach(card => {
    const item = document.createElement('div');
    item.className = 'card-list-item' + (card.id === selectedCardId ? ' active' : '');
    item.onclick = () => selectCard(card.id);
    item.innerHTML = `
      <div class="card-swatch" style="background:${card.color}"></div>
      <div class="card-list-info">
        <div class="card-list-name">${escapeHtml(card.name || 'Untitled')}</div>
        <div class="card-list-meta">${card.rarity} &middot; ${card.copies}x</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function selectCard(id) {
  selectedCardId = id;
  renderCardList();
  const card = cards.find(c => c.id === id);
  if (!card) return;

  document.getElementById('editor-empty').style.display = 'none';
  document.getElementById('card-editor').style.display = 'block';
  document.getElementById('back-preview-container').style.display = 'block';

  document.getElementById('field-name').value = card.name;
  document.getElementById('field-rarity').value = card.rarity;
  document.getElementById('field-type').value = card.type;
  document.getElementById('field-color').value = card.color;
  document.getElementById('field-weakness').value = card.weakness;
  document.getElementById('field-strength').value = card.strength;
  document.getElementById('field-help').value = card.help;
  document.getElementById('field-copies').value = card.copies;
  document.getElementById('field-back-color').value = card.backColor;
  document.getElementById('field-back-text').value = card.backText;

  for (let i = 0; i < 4; i++) {
    document.getElementById(`field-power${i + 1}-name`).value = card.powers[i].name;
    document.getElementById(`field-power${i + 1}-value`).value = card.powers[i].value;
  }

  const uploadArea = document.getElementById('image-upload-area');
  const removeBtn = document.getElementById('btn-remove-image');
  if (card.image) {
    uploadArea.innerHTML = `<input type="file" id="field-image" accept="image/*" onchange="handleImageUpload(this)" hidden><img src="${card.image}" alt="Card image">`;
    uploadArea.classList.add('has-image');
    removeBtn.style.display = '';
  } else {
    uploadArea.innerHTML = '<input type="file" id="field-image" accept="image/*" onchange="handleImageUpload(this)" hidden><p>Click or drag an image here</p>';
    uploadArea.classList.remove('has-image');
    removeBtn.style.display = 'none';
  }

  const backArea = document.getElementById('back-upload-area');
  const removeBackBtn = document.getElementById('btn-remove-back');
  if (card.backImage) {
    backArea.innerHTML = `<input type="file" id="field-back-image" accept="image/*" onchange="handleBackImageUpload(this)" hidden><img src="${card.backImage}" alt="Back image">`;
    backArea.classList.add('has-image');
    removeBackBtn.style.display = '';
  } else {
    backArea.innerHTML = '<input type="file" id="field-back-image" accept="image/*" onchange="handleBackImageUpload(this)" hidden><p>Click or drag a back image here</p>';
    backArea.classList.remove('has-image');
    removeBackBtn.style.display = 'none';
  }

  renderPreview(card);
}

function renderPreview(card) {
  const preview = document.getElementById('card-preview');
  preview.innerHTML = renderCardFrontHTML(card);
  preview.querySelector('.card-inner').style.background = hexToGradient(card.color);

  const backPreview = document.getElementById('back-preview');
  backPreview.innerHTML = renderCardBackHTML(card);
}

function hexToGradient(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const darker = `rgb(${Math.floor(r * 0.3)},${Math.floor(g * 0.3)},${Math.floor(b * 0.3)})`;
  const mid = `rgb(${Math.floor(r * 0.6)},${Math.floor(g * 0.6)},${Math.floor(b * 0.6)})`;
  return `linear-gradient(135deg, ${darker} 0%, ${mid} 50%, ${darker} 100%)`;
}

function renderCardFrontHTML(card) {
  const imageContent = card.image
    ? `<img src="${card.image}" alt="${escapeHtml(card.name)}">`
    : '<span class="placeholder-text">No Image</span>';

  const powersHTML = card.powers.map(p =>
    `<div class="power-row"><span class="power-name">${escapeHtml(p.name || '—')}</span><span class="power-value">${p.value || 0}</span></div>`
  ).join('');

  return `
    <div class="card-inner" style="background:${hexToGradient(card.color)}">
      <div class="card-header-bar">
        <span class="card-name-display">${escapeHtml(card.name || 'Untitled')}</span>
        <span class="card-rarity-display" data-rarity="${card.rarity}">${card.rarity}</span>
      </div>
      <div class="card-image-area">
        ${imageContent}
      </div>
      <div class="card-type-bar">
        <span class="card-type-display">${escapeHtml(card.type || 'Type')}</span>
      </div>
      <div class="card-stats">
        <div class="stat-row">
          <span class="stat-label">Weakness:</span>
          <span>${escapeHtml(card.weakness || '—')}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Strength:</span>
          <span>${escapeHtml(card.strength || '—')}</span>
        </div>
        <div class="card-powers">
          ${powersHTML}
        </div>
        <div class="stat-row help-row">
          <span class="stat-label">Help:</span>
          <span>${card.help || 100}%</span>
        </div>
      </div>
    </div>
  `;
}

function renderCardBackHTML(card) {
  if (card.backImage) {
    return `<div class="card-back-inner" style="background:${card.backColor}"><img src="${card.backImage}" alt="Card back"></div>`;
  }
  return `<div class="card-back-inner" style="background:${card.backColor}">${escapeHtml(card.backText || '')}</div>`;
}

function updateField(field, value) {
  const card = cards.find(c => c.id === selectedCardId);
  if (!card) return;
  card[field] = value;
  renderPreview(card);
  renderCardList();
  saveCards();
}

function updatePower(index, prop, value) {
  const card = cards.find(c => c.id === selectedCardId);
  if (!card) return;
  if (prop === 'value') value = parseInt(value) || 0;
  card.powers[index][prop] = value;
  renderPreview(card);
  saveCards();
}

function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const card = cards.find(c => c.id === selectedCardId);
    if (!card) return;
    card.image = e.target.result;
    selectCard(card.id);
    saveCards();
  };
  reader.readAsDataURL(file);
}

function handleBackImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const card = cards.find(c => c.id === selectedCardId);
    if (!card) return;
    card.backImage = e.target.result;
    selectCard(card.id);
    saveCards();
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  const card = cards.find(c => c.id === selectedCardId);
  if (!card) return;
  card.image = null;
  selectCard(card.id);
  saveCards();
}

function removeBackImage() {
  const card = cards.find(c => c.id === selectedCardId);
  if (!card) return;
  card.backImage = null;
  selectCard(card.id);
  saveCards();
}

function addCard() {
  const card = createDefaultCard();
  cards.push(card);
  saveCards();
  selectCard(card.id);
}

function deleteCurrentCard() {
  if (!selectedCardId) return;
  cards = cards.filter(c => c.id !== selectedCardId);
  selectedCardId = cards.length > 0 ? cards[0].id : null;
  saveCards();
  renderCardList();
  if (selectedCardId) {
    selectCard(selectedCardId);
  } else {
    document.getElementById('editor-empty').style.display = '';
    document.getElementById('card-editor').style.display = 'none';
    document.getElementById('back-preview-container').style.display = 'none';
    document.getElementById('card-preview').innerHTML = `
      <div class="card-inner">
        <div class="card-header-bar">
          <span class="card-name-display">Card Name</span>
          <span class="card-rarity-display">common</span>
        </div>
        <div class="card-image-area"><span class="placeholder-text">No Image</span></div>
        <div class="card-type-bar"><span class="card-type-display">Type</span></div>
        <div class="card-stats">
          <div class="stat-row"><span class="stat-label">Weakness:</span><span>—</span></div>
          <div class="stat-row"><span class="stat-label">Strength:</span><span>—</span></div>
          <div class="card-powers">
            <div class="power-row"><span class="power-name">—</span><span class="power-value">0</span></div>
            <div class="power-row"><span class="power-name">—</span><span class="power-value">0</span></div>
            <div class="power-row"><span class="power-name">—</span><span class="power-value">0</span></div>
            <div class="power-row"><span class="power-name">—</span><span class="power-value">0</span></div>
          </div>
          <div class="stat-row help-row"><span class="stat-label">Help:</span><span>100%</span></div>
        </div>
      </div>`;
  }
}

function duplicateCurrentCard() {
  const card = cards.find(c => c.id === selectedCardId);
  if (!card) return;
  const dup = { ...card, id: generateId(), name: card.name + ' (copy)', powers: card.powers.map(p => ({ ...p })) };
  cards.push(dup);
  saveCards();
  selectCard(dup.id);
}

// Print view
function openPrintView() {
  const expandedCards = [];
  cards.forEach(card => {
    for (let i = 0; i < (card.copies || 1); i++) {
      expandedCards.push(card);
    }
  });

  if (expandedCards.length === 0) {
    alert('No cards to print. Create some cards first!');
    return;
  }

  const pages = document.getElementById('print-pages');
  pages.innerHTML = '';

  const cardsPerPage = 6;
  const totalPages = Math.ceil(expandedCards.length / cardsPerPage);

  for (let p = 0; p < totalPages; p++) {
    const startIdx = p * cardsPerPage;
    const pageCards = expandedCards.slice(startIdx, startIdx + cardsPerPage);

    // Front page
    const frontPage = document.createElement('div');
    frontPage.className = 'print-page front-page';
    pageCards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card-face card-front';
      cardEl.innerHTML = renderCardFrontHTML(card);
      frontPage.appendChild(cardEl);
    });
    // Fill empty slots with blank cards to keep grid aligned
    for (let i = pageCards.length; i < cardsPerPage; i++) {
      const empty = document.createElement('div');
      empty.className = 'card-face card-front';
      empty.style.visibility = 'hidden';
      frontPage.appendChild(empty);
    }
    pages.appendChild(frontPage);

    // Back page — same cards in reverse column order for double-sided printing
    // When flipped on the long edge, column order reverses:
    // Front: [1][2][3]  →  Back (rotated 180°): [3][2][1]
    //        [4][5][6]              [6][5][4]
    const backPage = document.createElement('div');
    backPage.className = 'print-page back-page';

    const reorderedBacks = reorderForBacks(pageCards, cardsPerPage);
    reorderedBacks.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card-face card-back';
      if (card) {
        cardEl.innerHTML = renderCardBackHTML(card);
      } else {
        cardEl.style.visibility = 'hidden';
      }
      backPage.appendChild(cardEl);
    });
    pages.appendChild(backPage);
  }

  document.getElementById('print-overlay').style.display = '';
  document.getElementById('app').style.display = 'none';
}

function reorderForBacks(pageCards, cardsPerPage) {
  // For a 3x2 grid printed double-sided with flip on long edge:
  // Front positions: [0,1,2,3,4,5] in a 3-col grid
  // Row 0: [0][1][2]
  // Row 1: [3][4][5]
  // When flipped on the long edge (top-to-bottom flip), rows stay but columns reverse
  // Back should be: [2][1][0] / [5][4][3] — then each card is rotated 180°
  const padded = [...pageCards];
  while (padded.length < cardsPerPage) padded.push(null);

  const cols = 3;
  const result = [];
  for (let row = 0; row < 2; row++) {
    for (let col = cols - 1; col >= 0; col--) {
      result.push(padded[row * cols + col]);
    }
  }
  return result;
}

function closePrintView() {
  document.getElementById('print-overlay').style.display = 'none';
  document.getElementById('app').style.display = '';
}

// Drag and drop support
function setupDragDrop() {
  ['image-upload-area', 'back-upload-area'].forEach(id => {
    const area = document.getElementById(id);
    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('drag-over');
    });
    area.addEventListener('dragleave', () => {
      area.classList.remove('drag-over');
    });
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const card = cards.find(c => c.id === selectedCardId);
        if (!card) return;
        if (id === 'image-upload-area') {
          card.image = ev.target.result;
        } else {
          card.backImage = ev.target.result;
        }
        selectCard(card.id);
        saveCards();
      };
      reader.readAsDataURL(file);
    });
  });
}

// Init
loadCards();
renderCardList();
if (cards.length > 0) {
  selectCard(cards[0].id);
}
setupDragDrop();
