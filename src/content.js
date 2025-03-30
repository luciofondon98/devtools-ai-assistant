// Variables para el modo de selección
let isSelectionMode = false;
let hoveredElement = null;

// Función para generar un selector único para un elemento
function generateUniqueSelector(element) {
    // Si tiene ID y es único, usarlo
    if (element.id && document.querySelectorAll(`#${element.id}`).length === 1) {
        return `document.querySelector('#${element.id}')`;
    }

    // Analizar atributos data- personalizados
    const dataAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `[${attr.name}="${attr.value}"]`);
    
    if (dataAttributes.length > 0) {
        const selector = dataAttributes.join('');
        if (document.querySelectorAll(selector).length === 1) {
            return `document.querySelector('${selector}')`;
        }
    }

    // Analizar roles ARIA
    if (element.getAttribute('role')) {
        const roleSelector = `[role="${element.getAttribute('role')}"]`;
        const elementsWithRole = document.querySelectorAll(roleSelector);
        if (elementsWithRole.length === 1) {
            return `document.querySelector('${roleSelector}')`;
        }
    }

    // Analizar clases específicas (evitar clases genéricas como 'container', 'wrapper', etc.)
    const genericClasses = ['container', 'wrapper', 'row', 'col', 'section', 'content', 'header', 'footer', 'main'];
    const specificClasses = Array.from(element.classList)
        .filter(className => !genericClasses.includes(className));

    if (specificClasses.length > 0) {
        const classSelector = '.' + specificClasses.join('.');
        if (document.querySelectorAll(classSelector).length === 1) {
            return `document.querySelector('${classSelector}')`;
        }
    }

    // Si el elemento tiene un texto único y específico
    const text = element.textContent.trim();
    if (text && text.length < 50) {
        const textSelector = `${element.tagName.toLowerCase()}:contains("${text}")`;
        const elementsWithText = Array.from(document.querySelectorAll(element.tagName))
            .filter(el => el.textContent.trim() === text);
        if (elementsWithText.length === 1) {
            return `document.evaluate("//${element.tagName.toLowerCase()}[text()='${text}']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
        }
    }

    // Si ninguna de las estrategias anteriores funcionó, construir un selector basado en la estructura
    let path = [];
    let currentElement = element;
    let foundUniqueSelector = false;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE && !foundUniqueSelector) {
        let selector = currentElement.tagName.toLowerCase();
        
        // Intentar con clases específicas primero
        const elementSpecificClasses = Array.from(currentElement.classList)
            .filter(className => !genericClasses.includes(className));
        
        if (elementSpecificClasses.length > 0) {
            selector += '.' + elementSpecificClasses.join('.');
            // Verificar si este selector es único
            if (document.querySelectorAll(selector).length === 1) {
                path = [selector];
                foundUniqueSelector = true;
                break;
            }
        }

        // Si no es único, agregar índice entre hermanos similares
        if (!foundUniqueSelector) {
            const siblings = Array.from(currentElement.parentNode?.children || [])
                .filter(child => child.tagName === currentElement.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(currentElement) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        path.unshift(selector);
        currentElement = currentElement.parentNode;

        // Verificar si el selector actual es único
        const currentPath = path.join(' > ');
        if (document.querySelectorAll(currentPath).length === 1) {
            foundUniqueSelector = true;
        }
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