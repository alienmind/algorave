const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docDir = path.join(__dirname, '../doc');
const sourceFile = path.join(docDir, 'architecture.mmd');
const tempFile = path.join(docDir, 'architecture_temp.mmd');
const outputFile = path.join(__dirname, '../web/public/doc/architecture.png');

console.log('--- Generating Architecture Diagram ---');

try {
    // 1. Read Source MMD
    let mmdContent = fs.readFileSync(sourceFile, 'utf8');

    // 2. Read and Convert Logos to Base64
    const openaiPath = path.join(docDir, 'openai-logo.png');
    const geminiPath = path.join(docDir, 'gemini-logo.png');

    const openaiB64 = fs.readFileSync(openaiPath, 'base64');
    const geminiB64 = fs.readFileSync(geminiPath, 'base64');

    const openaiDataUri = `data:image/png;base64,${openaiB64}`;
    // Gemini logo is svg (from previous steps), handle mime type correctly if needed
    // Actually the downloaded one 'gemini-logo.png' came from a URL that might be png or svg.
    // Let's assume standard PNG handling for robust base64 embedding if the file is png. 
    // IF it is an SVG file saved as .png, we should check magic bytes or just use the extension logic.
    // The last download for gemini was .svg URL saved to .png? 
    // Wait, the command was: curl -o doc/gemini-logo.png .../google-gemini.svg
    // So it's actually an SVG file named .png. Let's fix the mime type if we detect SVG content or just assume use svg mime.

    // Simple detection: check start of file string
    const geminiContent = fs.readFileSync(geminiPath, 'utf8');
    let geminiMime = 'image/png';
    if (geminiContent.includes('<svg')) {
        geminiMime = 'image/svg+xml';
    }

    const geminiDataUri = `data:${geminiMime};base64,${geminiB64}`;

    // 3. Inject Base64 into Content
    mmdContent = mmdContent.replace('OPENAI_LOGO_BASE64', openaiDataUri);
    mmdContent = mmdContent.replace('GEMINI_LOGO_BASE64', geminiDataUri);

    // 4. Write Temp File
    fs.writeFileSync(tempFile, mmdContent);
    console.log(`Created temp file: ${tempFile}`);

    // 5. Run mmdc
    console.log(`Running mmdc...`);
    // Run from root context
    const cmd = `npx mmdc -i "${tempFile}" -o "${outputFile}" -t dark -b transparent`;
    execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log(`Diagram generated at: ${outputFile}`);

    // Copy to doc/ folder so it's available for GitHub README/WORKSHOP rendering
    const docOutputFile = path.join(docDir, 'architecture.png');
    fs.copyFileSync(outputFile, docOutputFile);
    console.log(`Synced diagram to: ${docOutputFile}`);

} catch (err) {
    console.error('Error generating diagram:', err);
    process.exit(1);
} finally {
    // 6. Cleanup Temp File
    if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        console.log('Cleaned up temp file.');
    }
}
