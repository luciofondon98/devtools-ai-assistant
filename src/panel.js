// Initialize connection to the background script
const port = chrome.runtime.connect({ name: 'devtools-panel' });

// DOM Elements
let chatContainer;
let userInput;
let sendButton;
let loadingIndicator;
let elementPickerButton;

// State
let currentPageInfo = null;

// Add a message to the chat container
function addMessage(text, type) {
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }

    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';

    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = `avatar ${type}-avatar`;
    avatar.textContent = type === 'user' ? 'U' : 'A';

    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // Format code blocks
    let formattedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language ? ` class="language-${language}"` : '';
        return `<pre><code${lang}>${code.trim()}</code></pre>`;
    });
    
    // Format inline code
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Format line breaks
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedText;
    
    // Assemble message
    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(messageDiv);
    
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Initialize the panel
async function initializePanel() {
    try {
        // Initialize DOM elements
        chatContainer = document.getElementById('chatContainer');
        userInput = document.getElementById('userInput');
        sendButton = document.getElementById('sendButton');
        loadingIndicator = document.getElementById('loading');
        elementPickerButton = document.getElementById('elementPickerButton');

        if (!chatContainer || !userInput || !sendButton || !loadingIndicator || !elementPickerButton) {
            throw new Error('Required DOM elements not found');
        }

        // Add welcome message
        addMessage('👋 ¡Hola! Soy tu Asistente de JavaScript. Te puedo ayudar con:\n\n' +
                  '💻 Analizar el código JavaScript de la página actual\n' +
                  '⭐ Sugerir mejoras y buenas prácticas\n' +
                  '📖 Explicar fragmentos de código\n' +
                  '🎯 Generar selectores DOM\n\n' +
                  '¿En qué puedo ayudarte hoy? 👋', 'assistant');

        // Setup element picker
        elementPickerButton.addEventListener('click', toggleElementPicker);

        // Listen for selected elements
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'ELEMENT_SELECTED') {
                handleElementSelected(message);
            }
        });

        // Get page information
        const response = await chrome.runtime.sendMessage({ type: 'GET_PAGE_INFO' });
        currentPageInfo = response;
        console.log('Page info loaded:', currentPageInfo);

        // Auto-resize input field
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

    } catch (error) {
        console.error('Error initializing panel:', error);
        addMessage('Error initializing panel: ' + error.message, 'error');
    }
}

// Handle sending messages
async function sendMessage() {
    if (!userInput || !currentPageInfo) {
        console.error('Required elements not initialized');
        return;
    }

    const message = userInput.value.trim();
    if (!message) return;

    // Clear input and reset height
    userInput.value = '';
    userInput.style.height = '44px';

    // Add user message to chat
    addMessage(message, 'user');

    // Show loading indicator
    loadingIndicator.style.display = 'block';

    try {
        // Send message to background script
        const response = await chrome.runtime.sendMessage({
            type: 'SEND_TO_AI',
            message: message,
            pageInfo: currentPageInfo
        });

        // Add AI response to chat
        addMessage(response, 'assistant');
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Error: ' + error.message, 'error');
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Event Listeners
function setupEventListeners() {
    if (!sendButton || !userInput) {
        console.error('Required elements for event listeners not found');
        return;
    }

    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Focus input on load
    userInput.focus();
}

// Initialize the panel when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Panel page loaded, initializing...');
    initializePanel().then(() => {
        setupEventListeners();
    }).catch(error => {
        console.error('Failed to initialize panel:', error);
    });
});

// Función para manejar el elemento seleccionado
function handleElementSelected(elementInfo) {
    const { selector, tagName, classes, id, text } = elementInfo;
    
    // Crear un mensaje descriptivo
    let description = `📍 Elemento seleccionado:\n`;
    description += `• Tipo: <${tagName}>\n`;
    if (id) description += `• ID: "${id}"\n`;
    if (classes.length) description += `• Clases: ${classes.join(', ')}\n`;
    if (text) description += `• Texto: "${text}"\n`;
    
    description += `\nCódigo para seleccionar este elemento:\n`;
    description += `\`\`\`javascript\n${selector};\n\`\`\``;

    // Añadir el mensaje al chat
    addMessage(description, 'assistant');

    // Desactivar el modo de selección
    elementPickerButton.classList.remove('active');
}

// Función para activar/desactivar el selector de elementos
function toggleElementPicker() {
    const isActive = elementPickerButton.classList.toggle('active');
    
    // Actualizar el texto del botón
    elementPickerButton.textContent = isActive ? 'Seleccionando...' : 'Select Element';
    
    // Enviar mensaje al content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TOGGLE_ELEMENT_PICKER'
        });
    });
} 