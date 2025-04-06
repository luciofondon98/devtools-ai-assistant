// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''; // Will be replaced during build
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Available OpenAI models
const AVAILABLE_MODELS = [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo-preview'
];

// Store connections to DevTools panels
const connections = new Set();

// Store chat history for each tab
const chatHistory = new Map();

// Handle connections from DevTools panels
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'devtools-panel') {
        connections.add(port);
        port.onDisconnect.addListener(() => connections.delete(port));
        console.log('DevTools panel connected');
    }
});

// Handle messages from the popup and DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message.type);

    if (message.type === 'OPEN_DEVTOOLS') {
        // Get the current tab
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                // Open DevTools for the current tab
                chrome.windows.getCurrent(function(window) {
                    chrome.windows.update(window.id, { focused: true });
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_DEVTOOLS_PANEL' });
                    sendResponse({ success: true });
                });
            } else {
                sendResponse({ success: false, error: 'No active tab found' });
            }
        });
        return true; // Will respond asynchronously
    }

    if (message.type === 'GET_PAGE_INFO') {
        // Get information about the current page
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tab = tabs[0];
            if (!tab) {
                sendResponse({ error: 'No active tab found' });
                return;
            }

            try {
                // Execute content script to get page information
                const [result] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        return {
                            url: window.location.href,
                            title: document.title,
                            html: document.documentElement.outerHTML,
                            scripts: Array.from(document.scripts).map(script => script.src),
                            styles: Array.from(document.styleSheets).map(sheet => sheet.href)
                        };
                    }
                });
                console.log('Page info retrieved:', result.result);
                sendResponse(result.result);
            } catch (error) {
                console.error('Error getting page info:', error);
                sendResponse({ error: error.message });
            }
        });
        return true; // Will respond asynchronously
    }

    if (message.type === 'GET_AVAILABLE_MODELS') {
        sendResponse(AVAILABLE_MODELS);
        return true;
    }

    if (message.type === 'SEND_TO_AI') {
        if (!OPENAI_API_KEY) {
            console.error('OpenAI API key not configured');
            sendResponse('Error: OpenAI API key not configured. Please set it in the .env file.');
            return;
        }

        const { message: userMessage, pageInfo, model = 'gpt-3.5-turbo', tabId } = message;

        // Initialize chat history for this tab if it doesn't exist
        if (!chatHistory.has(tabId)) {
            chatHistory.set(tabId, []);
        }

        // Get current chat history
        const history = chatHistory.get(tabId);

        // Add system message if this is the first message
        if (history.length === 0) {
            history.push({
                role: 'system',
                content: `You are an AI assistant helping with web development. 
                         Current page: ${pageInfo.url}
                         Title: ${pageInfo.title}`
            });
        }

        // Add user message to history
        history.push({
            role: 'user',
            content: userMessage
        });

        // Call OpenAI API
        fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: history,
                temperature: 0.7,
                max_tokens: 500
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('OpenAI API error:', data.error);
                sendResponse('Error: ' + data.error.message);
            } else {
                console.log('AI response received');
                const assistantMessage = data.choices[0].message;
                
                // Add assistant response to history
                history.push(assistantMessage);
                
                // Keep only the last 10 messages to prevent history from growing too large
                if (history.length > 10) {
                    history.splice(1, history.length - 10);
                }
                
                sendResponse(assistantMessage.content);
            }
        })
        .catch(error => {
            console.error('Error calling OpenAI API:', error);
            sendResponse('Error: ' + error.message);
        });

        return true; // Will respond asynchronously
    }

    if (message.type === 'TOGGLE_ELEMENT_PICKER') {
        // Enviar el mensaje al content script de la pestaña inspeccionada
        chrome.tabs.sendMessage(message.tabId, { type: 'TOGGLE_ELEMENT_PICKER' }, response => {
            sendResponse(response);
        });
        return true; // Will respond asynchronously
    }

    if (message.type === 'ELEMENT_SELECTED') {
        // Reenviar el mensaje al panel de DevTools
        connections.forEach(port => {
            port.postMessage(message);
        });
        sendResponse({ success: true });
        return true;
    }
}); 