import { updateLayersPanel } from './ui.js';

let selectedItem = null;
let zIndexCounter = 1;
const canvas = document.getElementById('canvas');

// --- Funciones de Estado (para que otros archivos sepan qué está pasando) ---
export const getCanvasItems = () => Array.from(canvas.querySelectorAll('.canvas-item'));
export const getSelectedItem = () => selectedItem;

// --- Funciones de Creación y Selección ---

export function createItemOnCanvas(data, coords) {
    const newItem = document.createElement('img');
    newItem.src = data.src;
    newItem.className = 'canvas-item';
    // Crea un ID único para el objeto, ej: "base1-1678886400000"
    newItem.id = `${data.id}-${Date.now()}`;
    
    const canvasRect = canvas.getBoundingClientRect();
    const initialSize = 150; // Tamaño inicial de todos los objetos
    newItem.style.width = `${initialSize}px`;
    // Posiciona el objeto en el centro de donde se soltó
    newItem.style.left = `${coords.clientX - canvasRect.left - initialSize / 2}px`;
    newItem.style.top = `${coords.clientY - canvasRect.top - initialSize / 2}px`;
    
    makeItemInteractive(newItem);
    canvas.appendChild(newItem);
    selectItem(newItem); // Selecciona el nuevo objeto automáticamente
}

export function selectItem(item) {
    if (selectedItem) {
        selectedItem.classList.remove('selected');
    }
    selectedItem = item;
    selectedItem.classList.add('selected');
    selectedItem.style.zIndex = ++zIndexCounter; // Pone el objeto al frente
    updateLayersPanel(); // Actualiza el panel de capas para reflejar la selección
}

// --- Lógica de Interactividad para cada objeto ---

function makeItemInteractive(item) {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    item.appendChild(resizeHandle);

    // Eventos para iniciar el movimiento
    item.addEventListener('mousedown', (e) => startInteraction(e, 'move'));
    item.addEventListener('touchstart', (e) => startInteraction(e, 'move'), { passive: false });

    // Eventos para iniciar la redimensión
    resizeHandle.addEventListener('mousedown', (e) => startInteraction(e, 'resize'));
    resizeHandle.addEventListener('touchstart', (e) => startInteraction(e, 'resize'), { passive: false });
}


// --- Lógica Central de Interacción ---

let activeInteraction = null; // Guarda el tipo de acción: 'move' o 'resize'
let initialInteractionData = {}; // Guarda datos iniciales (posición, tamaño, etc.)

function startInteraction(e, type) {
    e.stopPropagation(); // Evita que eventos padres (como el del canvas) se disparen
    
    // Si la interacción no es sobre un objeto ya seleccionado, lo seleccionamos
    const item = e.currentTarget.classList.contains('canvas-item') ? e.currentTarget : e.currentTarget.parentElement;
    if (selectedItem !== item) {
        selectItem(item);
    }

    activeInteraction = type;
    const event = e.touches ? e.touches[0] : e;
    const itemRect = item.getBoundingClientRect();

    if (type === 'move') {
        initialInteractionData = {
            offsetX: event.clientX - itemRect.left,
            offsetY: event.clientY - itemRect.top
        };
    } else if (type === 'resize') {
        initialInteractionData = {
            startX: event.clientX,
            startY: event.clientY,
            initialWidth: item.offsetWidth,
            initialHeight: item.offsetHeight,
            aspectRatio: item.offsetWidth / item.offsetHeight
        };
    }

    // Añadimos los listeners al documento para que la acción continúe fuera del objeto
    document.addEventListener('mousemove', onInteractionMove);
    document.addEventListener('touchmove', onInteractionMove, { passive: false });
    document.addEventListener('mouseup', stopInteraction, { once: true });
    document.addEventListener('touchend', stopInteraction, { once: true });
}

function onInteractionMove(e) {
    if (!activeInteraction || !selectedItem) return;
    
    e.preventDefault();
    const event = e.touches ? e.touches[0] : e;
    const canvasRect = canvas.getBoundingClientRect();

    if (activeInteraction === 'move') {
        selectedItem.style.left = `${event.clientX - canvasRect.left - initialInteractionData.offsetX}px`;
        selectedItem.style.top = `${event.clientY - canvasRect.top - initialInteractionData.offsetY}px`;
    } else if (activeInteraction === 'resize') {
        const dx = event.clientX - initialInteractionData.startX;
        const newWidth = initialInteractionData.initialWidth + dx;
        
        if (newWidth > 20) { // Un tamaño mínimo para no desaparecer el objeto
            selectedItem.style.width = `${newWidth}px`;
            // Mantenemos la proporción
            selectedItem.style.height = `${newWidth / initialInteractionData.aspectRatio}px`;
        }
    }
}

function stopInteraction() {
    activeInteraction = null;
    document.removeEventListener('mousemove', onInteractionMove);
    document.removeEventListener('touchmove', onInteractionMove);
}

// --- Funciones Globales (Deseleccionar y Eliminar) ---

export function deselectAllItems() {
    if (selectedItem) {
        selectedItem.classList.remove('selected');
        selectedItem = null;
        updateLayersPanel();
    }
}

export function deleteSelectedItem(itemToDelete = selectedItem) {
    if (itemToDelete) {
        itemToDelete.remove();
        if (itemToDelete === selectedItem) {
            selectedItem = null;
        }
        updateLayersPanel();
    }
}

// Escucha las teclas Delete/Backspace para eliminar el objeto seleccionado
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItem) {
            deleteSelectedItem();
        }
    }
});