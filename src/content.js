// Variables para el modo de selección
let isSelectionMode = false;
let hoveredElement = null;

// Función para generar un selector único para un elemento
function generateUniqueSelector(element) {
    // Si tiene ID, usarlo
    if (element.id) {
        return `document.getElementById('${element.id}')`;
    }

    // Si no tiene ID, construir un selector CSS único
    let path = [];
    let currentElement = element;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        let selector = currentElement.tagName.toLowerCase();
        
        // Añadir clases si existen
        if (currentElement.className) {
            const classes = Array.from(currentElement.classList).join('.');
            selector += `.${classes}`;
        }

        // Añadir nth-child si tiene hermanos del mismo tipo
        let siblings = Array.from(currentElement.parentNode?.children || []);
        if (siblings.length > 1) {
            let index = siblings.indexOf(currentElement) + 1;
            selector += `:nth-child(${index})`;
        }

        path.unshift(selector);
        currentElement = currentElement.parentNode;
    }

    return `document.querySelector('${path.join(' > ')}')`;
}

// Función para resaltar el elemento
function highlightElement(element) {
    if (!element || element === document.body || element === document.documentElement) return;
    
    element.style.outline = '2px solid #ff0000';
    element.style.outlineOffset = '-2px';
}

// Función para quitar el resaltado
function removeHighlight(element) {
    if (!element) return;
    element.style.outline = '';
    element.style.outlineOffset = '';
}

// Manejador de movimiento del mouse
function handleMouseMove(e) {
    if (!isSelectionMode) return;

    if (hoveredElement) {
        removeHighlight(hoveredElement);
    }

    hoveredElement = e.target;
    highlightElement(hoveredElement);
    e.stopPropagation();
}

// Manejador de clic
function handleClick(e) {
    if (!isSelectionMode) return;

    e.preventDefault();
    e.stopPropagation();

    const element = e.target;
    const selector = generateUniqueSelector(element);
    
    // Enviar el selector al panel de DevTools
    chrome.runtime.sendMessage({
        type: 'ELEMENT_SELECTED',
        selector: selector,
        tagName: element.tagName.toLowerCase(),
        classes: Array.from(element.classList),
        id: element.id,
        text: element.textContent.trim().substring(0, 50) // Primeros 50 caracteres del texto
    });

    // Desactivar modo de selección
    disableSelectionMode();
}

// Función para activar el modo de selección
function enableSelectionMode() {
    isSelectionMode = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
}

// Función para desactivar el modo de selección
function disableSelectionMode() {
    isSelectionMode = false;
    document.body.style.cursor = '';
    if (hoveredElement) {
        removeHighlight(hoveredElement);
        hoveredElement = null;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick);
}

// Escuchar mensajes del background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_ELEMENT_PICKER') {
        if (!isSelectionMode) {
            enableSelectionMode();
        } else {
            disableSelectionMode();
        }
        sendResponse({ success: true });
    }
}); 