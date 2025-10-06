import { imageAssets, basePath, instagramUsername } from './config.js';
import { populatePalette, startHeaderImageRotator, updateLayersPanel, onLayerDelete } from './ui.js';
import { createItemOnCanvas, deselectAllItems, deleteSelectedItem } from './interactions.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Selección de Elementos del DOM ---
    const canvas = document.getElementById('canvas');
    const skyContainer = document.getElementById('sky-container');
    const saveBtn = document.getElementById('save-btn');
    const shareBtn = document.getElementById('share-btn');
    const resetBtn = document.getElementById('reset-btn');
    const muteBtn = document.getElementById('mute-btn');
    const ambientMusic = document.getElementById('ambient-music');
    const dropSound = document.getElementById('drop-sound');

    // --- INICIALIZACIÓN ---
    populatePalette();
    startHeaderImageRotator();
    setupGlobalEventListeners();
    onLayerDelete(deleteSelectedItem); // Conecta la función de borrar al panel de capas

    // Muestra el botón de compartir solo en dispositivos móviles
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        shareBtn.style.display = 'block';
    }

    // --- MANEJADORES DE EVENTOS GLOBALES ---
    function setupGlobalEventListeners() {
        // --- Botones de Control ---
        resetBtn.addEventListener('click', () => {
            if (confirm("¿Seguro que quieres empezar de nuevo? Se perderá tu creación.")) {
                location.reload();
            }
        });

        saveBtn.addEventListener('click', () => {
            deselectAllItems(); // Quita los bordes antes de guardar la imagen
            html2canvas(document.getElementById('canvas-wrapper')).then(canvasElement => {
                const link = document.createElement('a');
                link.download = 'mi-hogar-creativo.png';
                link.href = canvasElement.toDataURL('image/png');
                link.click();
            });
        });

        shareBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(instagramUsername).then(() => {
                alert(`¡Usuario "${instagramUsername}" copiado al portapapeles!\n\nAhora solo sigue estos pasos:\n1. Usa el botón de guardar (💾).\n2. Abre Instagram y crea una historia con la imagen guardada.\n3. ¡Pega el usuario para etiquetarnos!`);
            }).catch(err => {
                alert('No se pudo copiar el usuario. Por favor, etiquétanos manualmente: ' + instagramUsername);
            });
        });

        // --- Lógica de Sonido ---
        let isMuted = false;
        document.body.addEventListener('click', () => {
            if (ambientMusic.paused && !isMuted) {
                ambientMusic.play().catch(e => console.log("El usuario debe interactuar para iniciar el audio."));
            }
        }, { once: true });

        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            ambientMusic.muted = isMuted;
            dropSound.muted = isMuted;
            muteBtn.textContent = isMuted ? '▶️' : '🔊';
        });

        // --- Interacciones del Canvas ---
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas) deselectAllItems();
        });
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', handleDrop);

        // --- Eventos en las Piezas de la Paleta ---
        document.querySelectorAll('.piece').forEach(piece => {
            piece.addEventListener('dragstart', handleDragStart);
            piece.addEventListener('touchstart', handleTouchStart, { passive: false });
        });
        
        // --- Eventos Táctiles Globales para el arrastre "fantasma" ---
        document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.body.addEventListener('touchend', handleTouchEnd, { once: true });
    }

    // --- LÓGICA PARA ARRASTRAR Y SOLTAR (DRAG & DROP) ---
    let touchGhost = null; // Elemento "fantasma" que sigue el dedo
    let originalPiece = null;

    function handleDragStart(event) {
        const data = {
            id: event.target.id,
            category: event.target.dataset.category,
            src: event.target.src
        };
        event.dataTransfer.setData('text/plain', JSON.stringify(data));
    }

    function handleDrop(event) {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData('text'));
        placeItem(data, event);
    }

    function handleTouchStart(event) {
        originalPiece = event.target;
        // Prevenimos que se active el scroll mientras se arrastra una pieza
        if (originalPiece.classList.contains('piece')) {
             event.preventDefault();
        }

        touchGhost = originalPiece.cloneNode(true);
        touchGhost.style.position = 'fixed';
        touchGhost.style.zIndex = '2000';
        touchGhost.style.opacity = '0.7';
        touchGhost.style.pointerEvents = 'none'; // El fantasma no debe interceptar clics
        document.body.appendChild(touchGhost);
        moveGhost(event.touches[0]);
    }

    function handleTouchMove(event) {
        if (touchGhost) {
            event.preventDefault();
            moveGhost(event.touches[0]);
        }
    }
    
    function handleTouchEnd(event) {
        if (touchGhost) {
            const touch = event.changedTouches[0];
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

            if (canvas.contains(dropTarget) || skyContainer.contains(dropTarget)) {
                placeItem({
                    id: originalPiece.id,
                    category: originalPiece.dataset.category,
                    src: originalPiece.src
                }, touch);
            }
            document.body.removeChild(touchGhost);
            touchGhost = null;
        }
    }
    
    function moveGhost(touch) {
        touchGhost.style.left = `${touch.clientX - touchGhost.offsetWidth / 2}px`;
        touchGhost.style.top = `${touch.clientY - touchGhost.offsetHeight / 2}px`;
    }

    // --- Función Unificada para Colocar Items ---
    function placeItem(data, coords) {
        if (data.category === 'Backgrounds') {
            canvas.style.backgroundImage = `url(${data.src})`;
        } else if (data.category === 'Skies') {
            skyContainer.style.backgroundImage = `url(${data.src})`;
        } else {
            createItemOnCanvas(data, coords);
        }
        
        if (!ambientMusic.muted) {
            dropSound.currentTime = 0;
            dropSound.play();
        }
    }
});