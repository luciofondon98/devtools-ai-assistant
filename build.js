const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to replace environment variables in a file
function replaceEnvVariables(content) {
    return content.replace(
        /process\.env\.OPENAI_API_KEY/g,
        `'${process.env.OPENAI_API_KEY || ''}'`
    );
}

// Function to build a file
function buildFile(sourcePath, targetPath) {
    try {
        let content = fs.readFileSync(sourcePath, 'utf8');
        content = replaceEnvVariables(content);
        fs.writeFileSync(targetPath, content);
        console.log(`Built: ${targetPath}`);
    } catch (error) {
        console.error(`Error building ${sourcePath}:`, error);
    }
}

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Source directory
const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir);
}

// Files to process from src directory
const filesToProcess = [
    'manifest.json',
    'devtools.html',
    'devtools.js',
    'panel.html',
    'panel.js',
    'popup.html',
    'popup.js',
    'background.js',
    'content.js'
];

// Process each file from src to dist
filesToProcess.forEach(file => {
    const sourcePath = path.join(srcDir, file);
    const targetPath = path.join(distDir, file);
    
    if (fs.existsSync(sourcePath)) {
        buildFile(sourcePath, targetPath);
    } else {
        console.warn(`Warning: Source file not found: ${sourcePath}`);
    }
});

// Copy icons directory if it exists
const iconsDir = path.join(__dirname, 'icons');
const distIconsDir = path.join(distDir, 'icons');
if (fs.existsSync(iconsDir)) {
    if (!fs.existsSync(distIconsDir)) {
        fs.mkdirSync(distIconsDir);
    }
    fs.readdirSync(iconsDir).forEach(file => {
        const sourcePath = path.join(iconsDir, file);
        const targetPath = path.join(distIconsDir, file);
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied: ${targetPath}`);
    });
}

console.log('Build completed successfully!'); 