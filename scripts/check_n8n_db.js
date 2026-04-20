const fs = require('fs');
const path = require('path');

try {
    const dbPath = '/home/node/.n8n/database.sqlite';
    const stats = fs.statSync(dbPath);
    console.log('DB Size:', stats.size, 'bytes');

    // Try to read SQLite header
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(dbPath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // SQLite magic header
    if (buffer.toString('hex').startsWith('53514c')) {
        console.log('Valid SQLite database');
    } else {
        console.log('Not a valid SQLite file');
    }
} catch (e) {
    console.error('Error:', e.message);
}