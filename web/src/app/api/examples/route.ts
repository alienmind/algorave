
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const examplesDir = path.join(process.cwd(), 'public', 'examples');

        // Ensure directory exists
        if (!fs.existsSync(examplesDir)) {
            return NextResponse.json({ files: [] });
        }

        const files = fs.readdirSync(examplesDir)
            .filter(file => file.endsWith('.strudel'))
            .sort();

        return NextResponse.json({ files });
    } catch (error) {
        console.error('Error reading examples:', error);
        return NextResponse.json({ error: 'Failed to load examples' }, { status: 500 });
    }
}
