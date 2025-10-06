import { imageAssets, basePath } from './config.js';
import { getCanvasItems, selectItem } from './interactions.js';

const headerImg = document.getElementById('header-example-img');
const palette = document.getElementById('palette');
const canvasWrapper = document.getElementById('canvas-wrapper');
const layersList = document.getElementById('layers-list');
let deleteCallback = null;

let deleteBtn = null;

// Llena la paleta de herramientas con las imágenes de la configuración
export function populatePalette() {
    const categories = Object.keys(imageAssets).filter(cat => cat !== 'Examples');
    categories.forEach(category => {
        const details = document.createElement('details');
        if (category === 'Backgrounds' || category === 'Base') details.open = true;

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


export function updateLayersPanel() {
    layersList.innerHTML = ''; // Limpia la lista actual
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
        span.textContent = item.id.split('-')[0]; // Muestra un nombre limpio

        const btn = document.createElement('button');
        btn.className = 'layer-delete-btn';
        btn.innerHTML = '🗑️';

        li.appendChild(img);
        li.appendChild(span);
        li.appendChild(btn);
        
        // Evento para seleccionar el objeto al hacer clic en la capa
        li.addEventListener('click', (e) => {
            if (e.target !== btn) { // No seleccionar si se hace clic en el botón de borrar
                selectItem(item);
            }
        });

        // Evento para borrar el objeto
        btn.addEventListener('click', () => {
            if (deleteCallback) deleteCallback(item);
        });

        layersList.prepend(li); // Añade el nuevo item al principio (capa superior)
    });
}

// Recibe la función que se ejecutará al borrar
export function onLayerDelete(callback) {
    deleteCallback = callback;
}