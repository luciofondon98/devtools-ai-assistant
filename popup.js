document.addEventListener('DOMContentLoaded', function() {
    const openButton = document.getElementById('openDevTools');
    const status = document.getElementById('status');

    openButton.addEventListener('click', function() {
        // Send message to background script to open DevTools
        chrome.runtime.sendMessage({ type: 'OPEN_DEVTOOLS' }, function(response) {
            if (response && response.success) {
                status.textContent = 'DevTools panel opened! Look for the "AI Assistant" tab.';
                status.style.color = '#4CAF50';
            } else {
                status.textContent = 'Error: Could not open DevTools panel. Please try again.';
                status.style.color = '#f44336';
            }
        });
    });
}); 