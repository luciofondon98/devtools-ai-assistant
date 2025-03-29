// Create the DevTools panel
chrome.devtools.panels.create(
    "AI Assistant",
    null, // No icon path
    "panel.html",
    (panel) => {
        console.log("AI Assistant panel created");
    }
); 