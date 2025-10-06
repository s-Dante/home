import { imageAssets, basePath } from './config.js';
import { selectItem, getCanvasItems, deleteSelectedItem } from './interactions.js';

const headerImg = document.getElementById('header-example-img');
const palette = document.getElementById('palette');
const layersList = document.getElementById('layers-list');

export function populatePalette() {
    const categories = Object.keys(imageAssets).filter(cat => cat !== 'Examples');
    categories.forEach(category => {
        if (imageAssets[category].length === 0) return;

        const details = document.createElement('details');
        if (['Backgrounds', 'Skies', 'Base'].includes(category)) details.open = true;

        const summary = document.createElement('summary');
        summary.textContent = category;
        details.appendChild(summary);

        const container = document.createElement('div');
        container.className = 'piece-container';
        imageAssets[category].forEach(fileName => {
            const img = document.createElement('img');
            img.src = `${basePath}${category}/${fileName}`;
            img.id = fileName.split('.')[0];
            img.className = 'piece';
            img.draggable = true;
            img.dataset.category = category;
            container.appendChild(img);
        });
        details.appendChild(container);
        palette.appendChild(details);
    });
}

export function startHeaderImageRotator() {
    let currentIndex = 0;
    const exampleImages = imageAssets.Examples;
    if (!exampleImages || exampleImages.length === 0) return;

    headerImg.src = `${basePath}Examples/${exampleImages[0]}`;
    setInterval(() => {
        currentIndex = (currentIndex + 1) % exampleImages.length;
        headerImg.style.transform = 'scale(0.9)';
        setTimeout(() => {
            headerImg.src = `${basePath}Examples/${exampleImages[currentIndex]}`;
            headerImg.style.transform = 'scale(1)';
        }, 250);
    }, 4000);
}

export function updateLayersPanel() {
    layersList.innerHTML = '';
    const items = getCanvasItems();

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'layer-item';
        li.dataset.itemId = item.id;
        if (item.classList.contains('selected')) {
            li.classList.add('selected');
        }

        const img = document.createElement('img');
        img.src = item.src;
        const span = document.createElement('span');
        span.textContent = item.id.split('-')[0];
        const btn = document.createElement('button');
        btn.className = 'layer-delete-btn';
        btn.innerHTML = '🗑️';

        li.appendChild(img);
        li.appendChild(span);
        li.appendChild(btn);
        
        li.addEventListener('click', (e) => {
            if (e.target !== btn) selectItem(item);
        });
        btn.addEventListener('click', () => deleteSelectedItem(item));

        layersList.prepend(li);
    });
}