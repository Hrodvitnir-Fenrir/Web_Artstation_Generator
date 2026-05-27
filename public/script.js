'use strict';

// ─── State ───────────────────────────────────────────────────────────────
let cardCount = 20;
let isLoading = false;

// ─── Grid sizing ─────────────────────────────────────────────────────────
// Find the col count that maximises square card size while keeping
// all rows visible. Card size is fixed in px; rows size naturally
// via aspect-ratio, so any leftover space falls to the bottom.
function computeGrid(count) {
    const header  = document.querySelector('header');
    const toolbar = document.querySelector('.toolbar');
    const GAP       = 3;
    const PADDING_X = 56; // 28px * 2
    const PADDING_Y = 24; // 12px * 2

    const W = window.innerWidth  - PADDING_X;
    const H = window.innerHeight - header.offsetHeight - toolbar.offsetHeight - PADDING_Y;

    let bestCols = 1, bestSize = 0;
    for (let cols = 1; cols <= count; cols++) {
        const rows  = Math.ceil(count / cols);
        const cardW = (W - GAP * (cols - 1)) / cols;
        const cardH = (H - GAP * (rows - 1)) / rows;
        const size  = Math.min(cardW, cardH);
        if (size > bestSize) { bestSize = size; bestCols = cols; }
    }

    const bestRows = Math.ceil(count / bestCols);
    const cardW    = (W - GAP * (bestCols - 1)) / bestCols;
    const cardH    = (H - GAP * (bestRows  - 1)) / bestRows;
    const cardSize = Math.floor(Math.min(cardW, cardH));

    return { cols: bestCols, cardSize };
}

function applyGrid(count) {
    const { cols, cardSize } = computeGrid(count);
    // Fixed-width columns; rows auto-size via aspect-ratio: 1/1 on .card
    gallery.style.gridTemplateColumns = `repeat(${cols}, ${cardSize}px)`;
    gallery.style.gridTemplateRows    = '';
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => applyGrid(cardCount), 120);
});

const gallery     = document.getElementById('gallery');
const refreshBtn  = document.getElementById('refreshAll');
const countBadge  = document.getElementById('countBadge');
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxLink  = document.getElementById('lightboxLink');
const lightboxClose = document.getElementById('lightboxClose');

// Status notification
const statusBar = document.createElement('div');
statusBar.className = 'status-bar';
document.body.appendChild(statusBar);

let statusTimer = null;
function showStatus(msg, duration = 2500) {
    statusBar.textContent = msg;
    statusBar.classList.add('visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => statusBar.classList.remove('visible'), duration);
}

// ─── Card creation ────────────────────────────────────────────────────────
function createCard(index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.03}s`;

    card.innerHTML = `
        <div class="card-skeleton"></div>
        <img class="card-img" alt="">
        <div class="card-overlay">
            <div class="card-title"></div>
            <div class="card-author"></div>
        </div>
        <div class="card-actions">
            <a class="card-btn card-open" href="#" target="_blank" title="Voir sur ArtStation">↗</a>
            <button class="card-btn card-reload" title="Nouvelle image">↺</button>
        </div>
    `;

    card.querySelector('.card-open').addEventListener('click', e => e.stopPropagation());
    card.querySelector('.card-reload').addEventListener('click', e => {
        e.stopPropagation();
        loadSingleCard(card);
    });

    card.addEventListener('click', () => {
        const img   = card.querySelector('.card-img');
        const title = card.querySelector('.card-title').textContent;
        const link  = card.querySelector('.card-open').href;
        if (!img.classList.contains('loaded')) return;
        openLightbox(img.src, title, link);
    });

    return card;
}

// ─── Load single card ─────────────────────────────────────────────────────
async function loadSingleCard(card) {
    card.classList.remove('loaded', 'error');
    const img = card.querySelector('.card-img');
    img.classList.remove('loaded');
    img.src = '';

    try {
        const { data } = await axios.get('/random_project.json');
        const imageUrl = data.cover?.smaller_square_image_url || data.cover?.image_url;
        if (!imageUrl) throw new Error('No image URL');

        img.onload = () => { img.classList.add('loaded'); card.classList.add('loaded'); };
        img.onerror = () => { card.classList.add('error'); };
        img.src = imageUrl;

        card.querySelector('.card-open').href = data.permalink || '#';
        card.querySelector('.card-title').textContent  = data.title || 'Sans titre';
        card.querySelector('.card-author').textContent = data.user?.username || '';
    } catch (err) {
        console.warn('Failed to load card:', err.message);
        card.classList.add('error');
    }
}

// ─── Build gallery ────────────────────────────────────────────────────────
function buildGallery(count) {
    gallery.innerHTML = '';
    applyGrid(count);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) fragment.appendChild(createCard(i));
    gallery.appendChild(fragment);
    countBadge.textContent = `${count} images`;
}

// ─── Refresh all ─────────────────────────────────────────────────────────
async function refreshAll() {
    if (isLoading) return;
    isLoading = true;
    refreshBtn.classList.add('loading');
    showStatus('Chargement des images…', 60000);

    buildGallery(cardCount);
    const cards = [...gallery.querySelectorAll('.card')];

    const WAVE = 5;
    for (let i = 0; i < cards.length; i += WAVE) {
        await Promise.all(cards.slice(i, i + WAVE).map(c => loadSingleCard(c)));
    }

    isLoading = false;
    refreshBtn.classList.remove('loading');
    showStatus('✓ Galerie mise à jour');
}

// ─── Lightbox ─────────────────────────────────────────────────────────────
function openLightbox(src, title, link) {
    lightboxImg.src       = src;
    lightboxTitle.textContent = title;
    lightboxLink.href     = link;
    lightbox.classList.remove('hidden');
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.add('hidden');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ─── Toolbar controls ─────────────────────────────────────────────────────
refreshBtn.addEventListener('click', refreshAll);

document.querySelectorAll('.grid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.grid-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cardCount = parseInt(btn.dataset.count);
        refreshAll();
    });
});

// ─── Init ─────────────────────────────────────────────────────────────────
window.addEventListener('load', refreshAll);