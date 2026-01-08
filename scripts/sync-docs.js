const fs = require('fs');
const path = require('path');

const srcDocDir = path.join(__dirname, '..', 'doc');
const destPublicDir = path.join(__dirname, '..', 'web', 'public');
const destDocDir = path.join(destPublicDir, 'doc');

function copyFile(src, dest) {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${src} to ${dest}`);
    } else {
        console.warn(`Warning: Source file ${src} does not exist.`);
    }
}

// Ensure destination directories exist
if (!fs.existsSync(destPublicDir)) fs.mkdirSync(destPublicDir, { recursive: true });
if (!fs.existsSync(destDocDir)) fs.mkdirSync(destDocDir, { recursive: true });

// 1. Ensure directories exist (handled above)
// presentation.html is now generated directly into destDocDir by the build process.

// 2. Copy images to web/public/doc/ so relative links "doc/image.png" work from presentation.html
const filesToCopy = ['logo.png', 'custom.css', 'architecture.png', 'strudel.jpg', 'strudel_icon.png'];
filesToCopy.forEach(file => {
    copyFile(path.join(srcDocDir, file), path.join(destDocDir, file));
});

console.log('Documentation sync complete.');
