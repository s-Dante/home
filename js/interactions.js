import { updateLayersPanel } from './ui.js';

let selectedItem = null;
let zIndexCounter = 1;
const canvas = document.getElementById('canvas');

// --- Funciones de Estado ---
export const getCanvasItems = () => Array.from(canvas.querySelectorAll('.canvas-item'));

// --- Creación y Selección de Items ---
export function createItemOnCanvas(data, coords) {
    const newItem = document.createElement('img');
    newItem.src = data.src;
    newItem.className = 'canvas-item';
    newItem.id = `${data.id}-${Date.now()}`;
    
    const canvasRect = canvas.getBoundingClientRect();
    const initialSize = 150;
    newItem.style.width = `${initialSize}px`;
    newItem.style.left = `${coords.clientX - canvasRect.left - initialSize / 2}px`;
    newItem.style.top = `${coords.clientY - canvasRect.top - initialSize / 2}px`;
    
    makeItemInteractive(newItem);
    canvas.appendChild(newItem);
    selectItem(newItem);
}

export function selectItem(item) {
    if (selectedItem) {
        selectedItem.classList.remove('selected');
    }
    selectedItem = item;
    if (item) {
        selectedItem.classList.add('selected');
        selectedItem.style.zIndex = ++zIndexCounter;
    }
    updateLayersPanel();
}

// --- Interactividad de Items ---
function makeItemInteractive(item) {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    item.appendChild(resizeHandle);

    item.addEventListener('mousedown', (e) => startInteraction(e, 'move'));
    item.addEventListener('touchstart', (e) => startInteraction(e, 'move'), { passive: false });

    resizeHandle.addEventListener('mousedown', (e) => startInteraction(e, 'resize'));
    resizeHandle.addEventListener('touchstart', (e) => startInteraction(e, 'resize'), { passive: false });
}

// --- Lógica Central de Interacción ---
let activeInteraction = null;
let initialInteractionData = {};

function startInteraction(e, type) {
    e.stopPropagation();
    const item = e.currentTarget.classList.contains('canvas-item') ? e.currentTarget : e.currentTarget.parentElement;
    selectItem(item);

    activeInteraction = type;
    const event = e.touches ? e.touches[0] : e;

    if (type === 'move') {
        initialInteractionData = {
            offsetX: event.clientX - item.getBoundingClientRect().left,
            offsetY: event.clientY - item.getBoundingClientRect().top
        };
    } else if (type === 'resize') {
        const itemRect = item.getBoundingClientRect();
        initialInteractionData = {
            startX: event.clientX,
            initialWidth: itemRect.width,
            aspectRatio: itemRect.width / itemRect.height
        };
    }

    document.addEventListener('mousemove', onInteractionMove);
    document.addEventListener('touchmove', onInteractionMove, { passive: false });
    document.addEventListener('mouseup', stopInteraction, { once: true });
    document.addEventListener('touchend', stopInteraction, { once: true });
}

function onInteractionMove(e) {
    if (!activeInteraction || !selectedItem) return;
    e.preventDefault();
    const event = e.touches ? e.touches[0] : e;

    if (activeInteraction === 'move') {
        const canvasRect = canvas.getBoundingClientRect();
        selectedItem.style.left = `${event.clientX - canvasRect.left - initialInteractionData.offsetX}px`;
        selectedItem.style.top = `${event.clientY - canvasRect.top - initialInteractionData.offsetY}px`;
    } else if (activeInteraction === 'resize') {
        const dx = event.clientX - initialInteractionData.startX;
        const newWidth = initialInteractionData.initialWidth + dx;
        if (newWidth > 20) {
            selectedItem.style.width = `${newWidth}px`;
            selectedItem.style.height = `${newWidth / initialInteractionData.aspectRatio}px`;
        }
    }
}

function stopInteraction() {
    activeInteraction = null;
    document.removeEventListener('mousemove', onInteractionMove);
    document.removeEventListener('touchmove', onInteractionMove);
}

// --- Funciones Globales ---
export function deselectAllItems() {
    selectItem(null);
}

export function deleteSelectedItem(itemToDelete = selectedItem) {
    if (itemToDelete) {
        const isSelectedItem = itemToDelete === selectedItem;
        itemToDelete.remove();
        if (isSelectedItem) {
            selectedItem = null;
        }
        updateLayersPanel();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedItem();
    }
});