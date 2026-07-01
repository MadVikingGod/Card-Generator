const STORAGE_KEY = 'card-generator-cards';
const BACK_STORAGE_KEY = 'card-generator-back';
// Sentinel id for the shared card back, shown as a special item in the list.
const BACK_ID = '__back__';

let cards = [];
let selectedCardId = null;
// One shared card back used by every card (color + optional image).
let cardBack = { image: null, color: '#1e3a5f' };

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
    health: 100,
    copies: 1,
  };
}

function saveCards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.warn('Storage full, saving without images');
    const lite = cards.map(c => ({ ...c, image: null }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lite));
  }
}

function saveBack() {
  try {
    localStorage.setItem(BACK_STORAGE_KEY, JSON.stringify(cardBack));
  } catch (e) {
    console.warn('Storage full, saving back without image');
    localStorage.setItem(BACK_STORAGE_KEY, JSON.stringify({ ...cardBack, image: null }));
  }
}

function loadCards() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      cards = JSON.parse(data);
      cards.forEach(c => {
        if (!c.powers) c.powers = [{ name: '', value: 0 }, { name: '', value: 0 }, { name: '', value: 0 }, { name: '', value: 0 }];
        // Migrate legacy "help" field to "health"
        if (c.health === undefined) c.health = c.help !== undefined ? c.help : 100;
        delete c.help;
        if (c.copies === undefined) c.copies = 1;
      });
    }
  } catch (e) {
    console.warn('Failed to load cards', e);
  }
}

function loadBack() {
  try {
    const data = localStorage.getItem(BACK_STORAGE_KEY);
    if (data) {
      cardBack = JSON.parse(data);
      delete cardBack.text; // drop legacy back text
      return;
    }
    // Migrate: seed the shared back from the first legacy card that had one.
    const legacy = cards.find(c => c.backImage || c.backColor);
    if (legacy) {
      cardBack = {
        image: legacy.backImage || null,
        color: legacy.backColor || '#1e3a5f',
      };
    }
    cards.forEach(c => { delete c.backImage; delete c.backColor; delete c.backText; });
  } catch (e) {
    console.warn('Failed to load card back', e);
  }
}

function renderCardList() {
  const list = document.getElementById('card-list');
  list.innerHTML = '';

  // Special item for the shared card back.
  const backItem = document.createElement('div');
  backItem.className = 'card-list-item back-item' + (selectedCardId === BACK_ID ? ' active' : '');
  backItem.onclick = () => selectBack();
  const backSwatch = cardBack.image
    ? `background-image:url(${cardBack.image});background-size:cover;background-position:center`
    : `background:${cardBack.color}`;
  backItem.innerHTML = `
    <div class="card-swatch" style="${backSwatch}"></div>
    <div class="card-list-info">
      <div class="card-list-name">Card Back</div>
      <div class="card-list-meta">shared by all cards</div>
    </div>
  `;
  list.appendChild(backItem);

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

function selectBack() {
  selectedCardId = BACK_ID;
  renderCardList();
  document.getElementById('editor-empty').style.display = 'none';
  document.getElementById('card-editor').style.display = 'none';
  document.getElementById('back-editor').style.display = 'block';
  document.getElementById('editor-title').textContent = 'Edit Card Back';
  document.getElementById('card-preview-container').style.display = 'none';
  document.getElementById('back-preview-container').style.display = '';
  renderBackEditor();
  renderBackPreview();
}

function selectCard(id) {
  selectedCardId = id;
  renderCardList();
  const card = cards.find(c => c.id === id);
  if (!card) return;

  document.getElementById('editor-empty').style.display = 'none';
  document.getElementById('card-editor').style.display = 'block';
  document.getElementById('back-editor').style.display = 'none';
  document.getElementById('editor-title').textContent = 'Edit Card';
  document.getElementById('card-preview-container').style.display = '';
  document.getElementById('back-preview-container').style.display = 'none';

  document.getElementById('field-name').value = card.name;
  document.getElementById('field-rarity').value = card.rarity;
  document.getElementById('field-type').value = card.type;
  document.getElementById('field-color').value = card.color;
  document.getElementById('field-weakness').value = card.weakness;
  document.getElementById('field-strength').value = card.strength;
  document.getElementById('field-health').value = card.health;
  document.getElementById('field-copies').value = card.copies;

  for (let i = 0; i < 4; i++) {
    document.getElementById(`field-power${i + 1}-name`).value = card.powers[i].name;
    document.getElementById(`field-power${i + 1}-value`).value = card.powers[i].value || '';
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

  renderPreview(card);
}

function renderPreview(card) {
  const preview = document.getElementById('card-preview');
  preview.innerHTML = renderCardFrontHTML(card);
}

function renderBackEditor() {
  document.getElementById('field-back-color').value = cardBack.color;

  const backArea = document.getElementById('back-upload-area');
  const removeBackBtn = document.getElementById('btn-remove-back');
  if (cardBack.image) {
    backArea.innerHTML = `<input type="file" id="field-back-image" accept="image/*" onchange="handleBackImageUpload(this)" hidden><img src="${cardBack.image}" alt="Back image">`;
    backArea.classList.add('has-image');
    removeBackBtn.style.display = '';
  } else {
    backArea.innerHTML = '<input type="file" id="field-back-image" accept="image/*" onchange="handleBackImageUpload(this)" hidden><p>Click or drag a back image here</p>';
    backArea.classList.remove('has-image');
    removeBackBtn.style.display = 'none';
  }
}

function renderBackPreview() {
  document.getElementById('back-preview').innerHTML = renderCardBackHTML();
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

  // Only show powers that have been filled in (a name or a non-zero value).
  const powersHTML = card.powers
    .filter(p => (p.name && p.name.trim()) || (p.value && p.value > 0))
    .map(p =>
      `<div class="power-row"><span class="power-name">${escapeHtml(p.name || '')}</span><span class="power-value">${p.value || 0}</span></div>`
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
          <span class="stat-label">Health:</span>
          <span>${card.health || 100}</span>
        </div>
      </div>
    </div>
  `;
}

function renderCardBackHTML() {
  const inner = cardBack.image
    ? `<img src="${cardBack.image}" alt="Card back">`
    : '';
  return `<div class="card-back-inner" style="background:${cardBack.color}">${inner}</div>`;
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

function updateBack(field, value) {
  cardBack[field] = value;
  renderBackPreview();
  renderCardList();
  saveBack();
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
    cardBack.image = e.target.result;
    renderBackEditor();
    renderBackPreview();
    renderCardList();
    saveBack();
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
  cardBack.image = null;
  renderBackEditor();
  renderBackPreview();
  renderCardList();
  saveBack();
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
          <div class="card-powers"></div>
          <div class="stat-row help-row"><span class="stat-label">Health:</span><span>100</span></div>
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

    // Back page — the shared back, positioned to mirror the fronts for
    // double-sided printing. When flipped on the long edge, column order
    // reverses, so a slot with a front gets a back at its mirrored position.
    const backPage = document.createElement('div');
    backPage.className = 'print-page back-page';

    const reorderedBacks = reorderForBacks(pageCards, cardsPerPage);
    reorderedBacks.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card-face card-back';
      if (card) {
        cardEl.innerHTML = renderCardBackHTML();
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
  const imgArea = document.getElementById('image-upload-area');
  attachDrop(imgArea, (result) => {
    const card = cards.find(c => c.id === selectedCardId);
    if (!card) return;
    card.image = result;
    selectCard(card.id);
    saveCards();
  });

  const backArea = document.getElementById('back-upload-area');
  attachDrop(backArea, (result) => {
    cardBack.image = result;
    renderBackEditor();
    renderBackPreview();
    renderCardList();
    saveBack();
  });
}

function attachDrop(area, onImage) {
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
    reader.onload = (ev) => onImage(ev.target.result);
    reader.readAsDataURL(file);
  });
}

// Init
loadCards();
loadBack();
renderCardList();
renderBackEditor();
renderBackPreview();
if (cards.length > 0) {
  selectCard(cards[0].id);
}
setupDragDrop();
