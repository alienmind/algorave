const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const WEB_PUBLIC_EXAMPLES_DIR = path.join(__dirname, '..', 'web', 'public', 'examples');
const MANIFEST_PATH = path.join(WEB_PUBLIC_EXAMPLES_DIR, 'manifest.json');

// Ensure destination directory exists
if (!fs.existsSync(WEB_PUBLIC_EXAMPLES_DIR)) {
    fs.mkdirSync(WEB_PUBLIC_EXAMPLES_DIR, { recursive: true });
}

// Read examples
const files = fs.readdirSync(EXAMPLES_DIR).filter(file => file.endsWith('.strudel'));
const examples = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(EXAMPLES_DIR, file), 'utf-8');
    // Simple title extraction: capitalize and replace _ with spaces, remove .strudel
    const title = file
        .replace('.strudel', '')
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Copy file
    fs.copyFileSync(path.join(EXAMPLES_DIR, file), path.join(WEB_PUBLIC_EXAMPLES_DIR, file));

    examples.push({
        filename: file,
        title: title,
        content: content // Embedding content for easy access
    });
});

// Write manifest
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(examples, null, 2));

console.log(`Synced ${examples.length} examples to ${WEB_PUBLIC_EXAMPLES_DIR}`);
