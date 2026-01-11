import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(__dirname, '../debug.log');

export function logToFile(msg: string) {
    // In Production, verify we don't block the Event Loop with Sync I/O
    if (process.env.NODE_ENV === 'production') {
        console.log(msg);
        return;
    }

    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(LOG_FILE, line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
}
