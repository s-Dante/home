document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------------------
    // ⚙️ CONFIGURACIÓN: ¡AQUÍ ES DONDE LISTAS TUS IMÁGENES! ⚙️
    // -----------------------------------------------------------------------------
    const imageAssets = {
        Examples: ['example1.png', 'example2.png', 'example3.png'], // Para el encabezado
        Backgrounds: ['fondo1.jpg'], // Para el fondo del canvas
        Base: ['base1.png', 'base2.png', 'base3.png'],
        Celling: ['celling1.png', 'celling2.png', 'celling3.png'],
        Doors: ['door1.png', 'door2.png', 'door3.png'],
        Windows: ['window1.png', 'window2.png', 'window3.png', 'window4.png', 'window5.png'],
        Decor: ['arbol1.png', 'maceta1.png']
    };
    const basePath = 'img/'; // Carpeta principal de imágenes

    // --- Selección de Elementos del DOM ---
    const headerImg = document.getElementById('header-example-img');
    const palette = document.getElementById('palette');
    const canvas = document.getElementById('canvas');
    let selectedItem = null; // Variable para guardar el item seleccionado en el canvas

    // --- 1. INICIALIZACIÓN ---
    populatePalette();
    startHeaderImageRotator();
    setupEventListeners();

    // --- 2. FUNCIONES DE INICIALIZACIÓN ---

    // Función para llenar la paleta dinámicamente
    function populatePalette() {
        // Omitimos 'Examples' porque no va en la paleta
        const categories = Object.keys(imageAssets).filter(cat => cat !== 'Examples');

        categories.forEach(category => {
            const details = document.createElement('details');
            if(category === 'Backgrounds' || category === 'Base') details.open = true;

            const summary = document.createElement('summary');
            summary.textContent = category;
            details.appendChild(summary);

            const container = document.createElement('div');
            container.className = 'piece-container';

            imageAssets[category].forEach(fileName => {
                const img = document.createElement('img');
                img.src = `${basePath}${category}/${fileName}`;
                img.id = fileName.split('.')[0]; // ID basado en el nombre de archivo
                img.className = 'piece';
                img.draggable = true;
                img.dataset.category = category; // Guardamos la categoría para uso posterior
                container.appendChild(img);
            });

            details.appendChild(container);
            palette.appendChild(details);
        });
    }
    
    // Función para rotar la imagen del encabezado
    function startHeaderImageRotator() {
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

    // --- 3. LÓGICA DE INTERACCIÓN PRINCIPAL ---

    function setupEventListeners() {
        // ... (Aquí irían los listeners de botones y audio, como en la versión anterior)

        // Event listener para el canvas para deseleccionar objetos
        canvas.addEventListener('click', (event) => {
            if (event.target === canvas) {
                deselectAllItems();
            }
        });

        // Agregamos listeners a las piezas recién creadas en la paleta
        document.querySelectorAll('.piece').forEach(piece => {
            // Eventos para Desktop (Drag and Drop API)
            piece.addEventListener('dragstart', handleDragStart);

            // Eventos para Móvil (Touch Events)
            piece.addEventListener('touchstart', handleTouchStart);
        });

        // Eventos en el Canvas para soltar
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', handleDrop);
        
        // Eventos táctiles para el canvas
        document.body.addEventListener('touchmove', handleTouchMove);
        document.body.addEventListener('touchend', handleTouchEnd);
    }
    
    // --- 4. MANEJADORES DE EVENTOS (DRAG & DROP Y TÁCTIL) ---

    let touchGhost = null; // Elemento "fantasma" que sigue al dedo
    let originalPiece = null;

    function handleDragStart(event) {
        event.dataTransfer.setData('text/plain', JSON.stringify({
            id: event.target.id,
            category: event.target.dataset.category,
            src: event.target.src
        }));
    }

    function handleTouchStart(event) {
        event.preventDefault();
        originalPiece = event.target;
        
        touchGhost = originalPiece.cloneNode();
        touchGhost.style.position = 'absolute';
        touchGhost.style.zIndex = '2000';
        touchGhost.style.opacity = '0.7';
        touchGhost.style.pointerEvents = 'none'; // Para que no interfiera con otros eventos
        document.body.appendChild(touchGhost);
        
        moveGhost(event.touches[0]);
    }

    function handleTouchMove(event) {
        if (touchGhost) {
            moveGhost(event.touches[0]);
        }
    }

    function handleTouchEnd(event) {
        if (touchGhost) {
            const touch = event.changedTouches[0];
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

            if (dropTarget === canvas || canvas.contains(dropTarget)) {
                // Si se suelta sobre el canvas, creamos la pieza
                 createCanvasItem({
                    id: originalPiece.id,
                    category: originalPiece.dataset.category,
                    src: originalPiece.src
                }, { clientX: touch.clientX, clientY: touch.clientY });
            }
            
            document.body.removeChild(touchGhost);
            touchGhost = null;
            originalPiece = null;
        }
    }

    function moveGhost(touch) {
        touchGhost.style.left = `${touch.clientX - touchGhost.offsetWidth / 2}px`;
        touchGhost.style.top = `${touch.clientY - touchGhost.offsetHeight / 2}px`;
    }

    function handleDrop(event) {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData('text'));
        createCanvasItem(data, event);
    }

    // --- 5. LÓGICA DEL CANVAS (CREAR, MOVER, REDIMENSIONAR) ---

    function createCanvasItem(data, event) {
        // Caso especial: El item es un fondo
        if (data.category === 'Backgrounds') {
            canvas.style.backgroundImage = `url(${data.src})`;
            // ... (Reproducir sonido si se desea)
            return; // Terminamos la función aquí
        }

        const newItem = document.createElement('img');
        newItem.src = data.src;
        newItem.className = 'canvas-item';
        newItem.style.position = 'absolute';

        const canvasRect = canvas.getBoundingClientRect();
        newItem.style.left = `${event.clientX - canvasRect.left - 50}px`; // 50 es la mitad de un ancho de 100px
        newItem.style.top = `${event.clientY - canvasRect.top - 50}px`;
        newItem.style.width = '100px'; // Tamaño inicial

        // Hacemos el nuevo item interactivo
        makeItemInteractive(newItem);

        canvas.appendChild(newItem);
        selectItem(newItem);
    }
    
    function makeItemInteractive(item) {
        let offsetX, offsetY;

        function onMouseDown(e) {
            e.preventDefault();
            selectItem(item);
            
            // Lógica para mover el item
            offsetX = e.clientX - item.getBoundingClientRect().left;
            offsetY = e.clientY - item.getBoundingClientRect().top;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        function onMouseMove(e) {
            const canvasRect = canvas.getBoundingClientRect();
            item.style.left = `${e.clientX - canvasRect.left - offsetX}px`;
            item.style.top = `${e.clientY - canvasRect.top - offsetY}px`;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        // Lógica para redimensionar con la rueda del mouse
        function onWheel(e) {
            if (item.classList.contains('selected')) {
                e.preventDefault();
                const scaleFactor = 0.1;
                const currentWidth = item.offsetWidth;
                if (e.deltaY < 0) { // Scroll hacia arriba = agrandar
                    item.style.width = `${currentWidth * (1 + scaleFactor)}px`;
                } else { // Scroll hacia abajo = achicar
                    item.style.width = `${currentWidth * (1 - scaleFactor)}px`;
                }
            }
        }
        
        item.addEventListener('mousedown', onMouseDown);
        item.addEventListener('wheel', onWheel);
        // Aquí se agregarían los eventos táctiles para mover y redimensionar items en el canvas
    }

    function selectItem(item) {
        deselectAllItems();
        selectedItem = item;
        item.classList.add('selected');
    }

    function deselectAllItems() {
        document.querySelectorAll('.canvas-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        selectedItem = null;
    }
    
    // ... Aquí irían las funciones de los botones (reset, save, mute) y de audio,
    // que serían muy similares a la versión anterior.
});