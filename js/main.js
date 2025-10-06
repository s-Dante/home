import { imageAssets, basePath, instagramUsername } from './config.js';
import { populatePalette, startHeaderImageRotator, updateLayersPanel } from './ui.js';
import { createItemOnCanvas, deselectAllItems, deleteSelectedItem } from './interactions.js';

document.addEventListener('DOMContentLoaded', () => {
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

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        shareBtn.style.display = 'block';
    }

    // --- MANEJADORES DE EVENTOS GLOBALES ---
    function setupGlobalEventListeners() {
        resetBtn.addEventListener('click', () => {
            if (confirm("¿Seguro que quieres empezar de nuevo? Se perderá tu creación.")) {
                location.reload();
            }
        });

        saveBtn.addEventListener('click', () => {
            deselectAllItems();
            setTimeout(() => { // Pequeño delay para asegurar que la deselección se renderice
                html2canvas(document.getElementById('canvas-wrapper')).then(canvasElement => {
                    const link = document.createElement('a');
                    link.download = 'mi-hogar-creativo.png';
                    link.href = canvasElement.toDataURL('image/png');
                    link.click();
                });
            }, 100);
        });

        shareBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(instagramUsername).then(() => {
                alert(`¡Usuario "${instagramUsername}" copiado!\n\nAhora sigue estos pasos:\n1. Guarda tu imagen con el botón 💾.\n2. Abre Instagram y crea una historia.\n3. ¡Pega el usuario para etiquetarnos!`);
            }).catch(() => {
                alert('No se pudo copiar el usuario. Etiquétanos manualmente: ' + instagramUsername);
            });
        });

        let isMuted = false;
        document.body.addEventListener('click', () => {
            if (ambientMusic.paused && !isMuted) {
                ambientMusic.play().catch(() => { });
            }
        }, { once: true });

        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            ambientMusic.muted = isMuted;
            dropSound.muted = isMuted;
            muteBtn.textContent = isMuted ? '▶️' : '🔊';
        });

        canvas.addEventListener('click', (e) => { if (e.target === canvas) deselectAllItems(); });
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', handleDrop);

        document.querySelectorAll('.piece').forEach(piece => {
            piece.addEventListener('dragstart', handleDragStart);
            piece.addEventListener('touchstart', handleTouchStart, { passive: false });
        });

        document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.body.addEventListener('touchend', handleTouchEnd);
    }

    // --- LÓGICA DRAG & DROP ---
    let touchGhost = null;
    let originalPiece = null;

    function handleDragStart(event) {
        const data = { id: event.target.id, category: event.target.dataset.category, src: event.target.src };
        event.dataTransfer.setData('text/plain', JSON.stringify(data));
    }

    function handleDrop(event) {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData('text'));
        placeItem(data, event);
    }

    function handleTouchStart(event) {
        if (event.target.classList.contains('piece')) {
            event.preventDefault();
            originalPiece = event.target;
            touchGhost = originalPiece.cloneNode(true);
            touchGhost.style.position = 'fixed';
            touchGhost.style.zIndex = '2000';
            touchGhost.style.opacity = '0.7';
            touchGhost.style.pointerEvents = 'none';
            document.body.appendChild(touchGhost);
            moveGhost(event.touches[0]);
        }
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
                const data = { id: originalPiece.id, category: originalPiece.dataset.category, src: originalPiece.src };
                placeItem(data, touch);
            }
            document.body.removeChild(touchGhost);
            touchGhost = null;
        }
    }

    function moveGhost(touch) {
        touchGhost.style.left = `${touch.clientX - touchGhost.offsetWidth / 2}px`;
        touchGhost.style.top = `${touch.clientY - touchGhost.offsetHeight / 2}px`;
    }

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