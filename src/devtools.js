// Create the DevTools panel
chrome.devtools.panels.create(
    "AI Assistant",
    null, // No icon path
    "panel.html",
    (panel) => {
        if (chrome.runtime.lastError) {
            console.error('Error creating panel:', chrome.runtime.lastError);
        } else {
            console.log("AI Assistant panel created successfully");
            panel.onShown.addListener(() => {
                console.log("Panel shown");
            });
            panel.onHidden.addListener(() => {
                console.log("Panel hidden");
            });
        }
    }
); 