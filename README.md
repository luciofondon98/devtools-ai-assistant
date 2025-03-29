# DevTools AI Assistant

A Chrome extension that adds AI-powered assistance to Chrome DevTools, helping developers analyze and improve their web applications.

## Features (MVP)

- New DevTools panel for AI assistance
- Keyboard shortcut (Ctrl+Shift+A) to quickly access the panel
- Ability to ask questions about the current page's code
- DOM analysis and selector generation
- JavaScript code analysis and suggestions
- Simple chat interface for interaction

## Technical Implementation

### Core Components

1. **manifest.json**
   - Uses Manifest V3 (latest Chrome extension standard)
   - Defines permissions: `activeTab`, `scripting`, and `storage`
   - Configures host permissions for OpenAI API
   - Sets up keyboard shortcut (Ctrl+Shift+A)
   - Defines extension icons and basic metadata

2. **devtools.html & devtools.js**
   - Entry point for the DevTools panel
   - Creates a new panel in Chrome DevTools named "AI Assistant"
   - Minimal HTML structure with necessary styling
   - JavaScript code to initialize the panel

3. **panel.html & panel.js**
   - Main interface for user interaction
   - Features:
     - Chat-like interface with message history
     - Input field for questions
     - Loading indicator
     - Error handling display
     - Modern dark theme UI
   - JavaScript functionality:
     - Manages chat messages
     - Handles user input
     - Communicates with background script
     - Maintains page context

4. **background.js**
   - Service worker implementation
   - Handles:
     - OpenAI API integration
     - Page information gathering
     - Message routing between panel and API
     - Connection management for DevTools panels

### Key Features Available in MVP:

1. **Code Analysis**
   - Ask questions about the current page's code
   - Get explanations of code snippets
   - Receive suggestions for improvements

2. **DOM Analysis**
   - Generate selectors for elements
   - Analyze page structure
   - Get insights about the DOM

3. **User Interface**
   - Clean, modern dark theme
   - Chat-like interface
   - Loading indicators
   - Error handling

4. **Integration**
   - OpenAI API integration
   - Real-time page analysis
   - Keyboard shortcuts

## Installation

### Prerequisites

1. Node.js and npm installed on your system
2. OpenAI API key

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/devtools-ai-assistant.git
   cd devtools-ai-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

4. Build the extension:
   ```bash
   npm run build
   ```

5. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `dist` directory

## Usage

1. Open Chrome DevTools (F12 or right-click -> Inspect)
2. Look for the "AI Assistant" panel in the DevTools tabs
3. Type your question in the input field and press Enter or click Send
4. The AI will analyze the current page and provide relevant assistance

## Development

### Building the Extension

The extension uses a build process to handle environment variables and create a distribution version:

```bash
# Development build with watch mode
npm run watch

# Production build
npm run build
```

The build process will:
1. Read environment variables from `.env`
2. Replace variables in the source files
3. Create a `dist` directory with the processed files
4. Copy all necessary assets

### Project Structure

```
devtools-ai-assistant/
├── dist/               # Built extension files
├── icons/             # Extension icons
├── src/               # Source files
├── .env               # Environment variables (not in git)
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
├── build.js           # Build script
├── manifest.json      # Extension manifest
├── package.json       # Project configuration
└── README.md          # This file
```

## Testing the Extension

### Basic Testing

1. Open a webpage with some JavaScript code (e.g., any modern web application)
2. Open DevTools and go to the "AI Assistant" panel
3. Try asking questions like:
   - "What does this code do?"
   - "How can I improve this function?"
   - "Generate a selector for this element"
   - "Explain this JavaScript code"

### Testing Scenarios

1. **Code Analysis Testing**
   - Open a webpage with complex JavaScript
   - Ask about specific functions or code blocks
   - Verify that the AI provides relevant explanations

2. **DOM Analysis Testing**
   - Right-click on any element and select "Inspect"
   - Ask the AI to generate selectors for that element
   - Verify the selectors work in the console

3. **Error Handling Testing**
   - Try asking questions without an API key configured
   - Check if appropriate error messages are shown
   - Verify loading indicators work correctly

4. **UI/UX Testing**
   - Test the keyboard shortcut (Ctrl+Shift+A)
   - Verify chat history is maintained
   - Check if the interface is responsive

### Troubleshooting

If you encounter issues:

1. **Extension Not Loading**
   - Make sure Developer mode is enabled
   - Check if all files are in the correct directory
   - Verify manifest.json is valid

2. **API Not Working**
   - Confirm your OpenAI API key is correctly set in .env
   - Check the browser console for error messages
   - Verify network permissions in manifest.json

3. **UI Issues**
   - Try refreshing the DevTools window
   - Check if the panel is visible in DevTools
   - Verify all CSS is loading correctly

## Permissions

The extension requires the following permissions:
- `activeTab`: To access the current tab's information
- `scripting`: To analyze page content
- `storage`: To store settings and preferences
- Host permission for OpenAI API

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 