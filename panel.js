// Initialize connection to the background script
const port = chrome.runtime.connect({ name: 'devtools-panel' });

// DOM Elements
let chatContainer;
let userInput;
let sendButton;
let loadingIndicator;

// State
let currentPageInfo = null;

// Add a message to the chat container
function addMessage(text, type) {
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // Format code blocks
    let formattedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });
    
    // Format inline code
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    messageDiv.innerHTML = formattedText;
    chatContainer.appendChild(messageDiv);
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

        if (!chatContainer || !userInput || !sendButton || !loadingIndicator) {
            throw new Error('Required DOM elements not found');
        }

        // Add welcome message first
        addMessage('Hello! I\'m your AI Assistant. I can help you with:\n' +
                  '- Analyzing the current page\'s code\n' +
                  '- Suggesting improvements\n' +
                  '- Explaining code snippets\n' +
                  '- Generating selectors\n' +
                  'What would you like to know?', 'assistant');

        // Then get page information
        const response = await chrome.runtime.sendMessage({ type: 'GET_PAGE_INFO' });
        currentPageInfo = response;
        console.log('Page info loaded:', currentPageInfo);
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

    // Clear input
    userInput.value = '';

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
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
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