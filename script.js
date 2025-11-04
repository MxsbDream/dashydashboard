// Dashboard builder with edit and image import support (localStorage persistence)

const grid = document.getElementById('grid');
const openAdd = document.getElementById('openAdd');
const modal = document.getElementById('modal');
const addForm = document.getElementById('addForm');
const iconInput = document.getElementById('iconInput');
const labelInput = document.getElementById('labelInput');
const urlInput = document.getElementById('urlInput');
const cancelBtn = document.getElementById('cancelBtn');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const clearImported = document.getElementById('clearImported');
const deleteBtn = document.getElementById('deleteBtn');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');

const STORAGE_KEY = 'wp_style_dashboard_items';

// State for editing
let editingIndex = null;
let importedDataUrl = null; // holds base64 data URL when a file is imported

// Utilities
function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function isImageUrl(url) {
  return /^https?:\/\/.+\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(url);
}

// Rendu d'une tuile
function createTile(item, index) {
  const a = document.createElement('a');
  a.href = item.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "block tile bg-white rounded-lg shadow-sm p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition";

  // Icône : si data URL -> img, si URL d'image -> img, sinon emoji/text
  if (item.icon && item.icon.startsWith && item.icon.startsWith('data:')) {
    const img = document.createElement('img');
    img.src = item.icon;
    img.alt = item.label || 'icône';
    img.className = "w-12 h-12 object-cover mb-2 rounded";
    a.appendChild(img);
  } else if (item.icon && isImageUrl(item.icon)) {
    const img = document.createElement('img');
    img.src = item.icon;
    img.alt = item.label || 'icône';
    img.className = "w-12 h-12 object-cover mb-2 rounded";
    a.appendChild(img);
  } else if (item.icon) {
    const span = document.createElement('div');
    span.className = "text-3xl mb-1";
    span.textContent = item.icon;
    a.appendChild(span);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = "w-12 h-12 bg-gray-100 rounded mb-2 flex items-center justify-center text-xl text-gray-500";
    placeholder.textContent = '🔗';
    a.appendChild(placeholder);
  }

  const label = document.createElement('div');
  label.className = "text-sm text-gray-800 truncate w-full";
  label.textContent = item.label || item.url;
  a.appendChild(label);

  // Wrapper to add overlay actions
  const wrapper = document.createElement('div');
  wrapper.className = "relative";
  wrapper.appendChild(a);

  const actions = document.createElement('div');
  actions.className = "absolute top-1 right-1 flex gap-1";

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.title = 'Éditer';
  editBtn.className = "bg-white/80 hover:bg-gray-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-xs";
  editBtn.innerHTML = '✎';
  editBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openModalForEdit(index);
  });

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.title = 'Supprimer';
  delBtn.className = "bg-white/80 hover:bg-red-100 text-red-500 rounded-full w-7 h-7 flex items-center justify-center text-xs";
  delBtn.innerHTML = '×';
  delBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    removeItem(index);
  });

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  wrapper.appendChild(actions);

  return wrapper;
}

// Rendu du tableau complet
function render() {
  grid.innerHTML = '';
  const items = loadItems();
  items.forEach((it, idx) => {
    const tile = createTile(it, idx);
    grid.appendChild(tile);

    // petite animation d'entrée
    tile.classList.add('tile-enter');
    requestAnimationFrame(() => {
      tile.classList.add('tile-enter-active');
      tile.classList.remove('tile-enter');
    });
  });

  // Tuile "ajouter"
  const addTile = document.createElement('div');
  addTile.className = "tile bg-blue-50 rounded-lg border-dashed border-2 border-blue-200 flex items-center justify-center cursor-pointer hover:bg-blue-100";
  addTile.innerHTML = '<div class="text-blue-600 text-4xl">+</div>';
  addTile.addEventListener('click', () => openModalForAdd());
  grid.appendChild(addTile);
}

// Add / Remove / Update
function addItem(item) {
  const items = loadItems();
  items.push(item);
  saveItems(items);
  render();
}

function updateItem(index, item) {
  const items = loadItems();
  if (index >= 0 && index < items.length) {
    items[index] = item;
    saveItems(items);
    render();
  }
}

function removeItem(index) {
  const items = loadItems();
  items.splice(index, 1);
  saveItems(items);
  render();
}

// Modal controls
function openModalForAdd() {
  editingIndex = null;
  importedDataUrl = null;
  modalTitle.textContent = 'Ajouter un raccourci';
  deleteBtn.classList.add('hidden');
  fileName.textContent = '';
  clearImported.classList.add('hidden');
  iconInput.value = '';
  labelInput.value = '';
  urlInput.value = '';
  saveBtn.textContent = 'Enregistrer';
  openModal();
}

function openModalForEdit(index) {
  const items = loadItems();
  const item = items[index];
  if (!item) return;
  editingIndex = index;
  modalTitle.textContent = 'Éditer le raccourci';
  deleteBtn.classList.remove('hidden');
  // Fill fields
  iconInput.value = item.icon && !item.icon.startsWith ? item.icon : item.icon || '';
  // If icon is data URL, show filename as "importé"
  if (item.icon && typeof item.icon === 'string' && item.icon.startsWith('data:')) {
    importedDataUrl = item.icon;
    fileName.textContent = 'Image importée';
    clearImported.classList.remove('hidden');
  } else {
    importedDataUrl = null;
    if (item.icon && isImageUrl(item.icon)) {
      iconInput.value = item.icon;
      fileName.textContent = '';
      clearImported.classList.add('hidden');
    } else {
      fileName.textContent = '';
      clearImported.classList.add('hidden');
    }
  }
  labelInput.value = item.label || '';
  urlInput.value = item.url || '';
  saveBtn.textContent = 'Enregistrer';
  openModal();
}

function openModal() {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => iconInput.focus(), 50);
}

function closeModal() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  addForm.reset();
  importedDataUrl = null;
  fileName.textContent = '';
  clearImported.classList.add('hidden');
  deleteBtn.classList.add('hidden');
}

// Events
openAdd.addEventListener('click', () => openModalForAdd());
cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// File import handling: convert to data URL and store in importedDataUrl
fileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    importedDataUrl = ev.target.result; // data:image/...
    fileName.textContent = file.name;
    clearImported.classList.remove('hidden');
    // Clear the icon input text to avoid conflict
    iconInput.value = '';
  };
  reader.readAsDataURL(file);
});

// Clear imported image
clearImported.addEventListener('click', () => {
  importedDataUrl = null;
  fileInput.value = '';
  fileName.textContent = '';
  clearImported.classList.add('hidden');
});

// Delete current item from modal (when editing)
deleteBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (editingIndex !== null) {
    if (confirm('Supprimer ce raccourci ?')) {
      removeItem(editingIndex);
      closeModal();
    }
  }
});

// Form submit (add or update)
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const iconVal = iconInput.value.trim();
  const labelVal = labelInput.value.trim();
  const urlVal = urlInput.value.trim();
  if (!urlVal) return alert('Le lien est requis.');

  // Decide icon precedence:
  // 1) importedDataUrl (file import)
  // 2) iconVal if looks like URL image or emoji/text
  let iconToUse = null;
  if (importedDataUrl) {
    iconToUse = importedDataUrl;
  } else if (iconVal) {
    iconToUse = iconVal;
  } else {
    iconToUse = '';
  }

  const newItem = {
    icon: iconToUse,
    label: labelVal,
    url: urlVal
  };

  if (editingIndex === null) {
    addItem(newItem);
  } else {
    updateItem(editingIndex, newItem);
  }

  closeModal();
});

// Initial render
render();
