// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''; // Will be replaced during build
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Store connections to DevTools panels
const connections = new Set();

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

    if (message.type === 'SEND_TO_AI') {
        if (!OPENAI_API_KEY) {
            console.error('OpenAI API key not configured');
            sendResponse('Error: OpenAI API key not configured. Please set it in the .env file.');
            return;
        }

        // Prepare the prompt with context
        const prompt = `Context: You are an AI assistant helping with web development. 
                       Current page: ${message.pageInfo.url}
                       Title: ${message.pageInfo.title}
                       
                       User question: ${message.message}
                       
                       Please provide a helpful response focusing on web development aspects.`;

        // Call OpenAI API
        fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
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
                sendResponse(data.choices[0].message.content);
            }
        })
        .catch(error => {
            console.error('Error calling OpenAI API:', error);
            sendResponse('Error: ' + error.message);
        });

        return true; // Will respond asynchronously
    }
}); 