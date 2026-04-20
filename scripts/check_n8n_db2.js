const fs = require('fs');

// Read SQLite file
const dbPath = '/home/node/.n8n/database.sqlite';
const stats = fs.statSync(dbPath);
console.log('DB Size:', Math.round(stats.size / 1024 / 1024), 'MB');

// Read first 100KB to look for workflow data
const fd = fs.openSync(dbPath, 'r');
const buffer = Buffer.alloc(100 * 1024);
fs.readSync(fd, buffer, 0, buffer.length, 0);
fs.closeSync(fd);

// Search for the webhook ID in the raw data
const searchStr = 'wPLypk7KhBcFLicX';
const hexSearch = Buffer.from(searchStr).toString('hex');

// Count occurrences
let count = 0;
for (let i = 0; i < buffer.length - searchStr.length; i++) {
    let match = true;
    for (let j = 0; j < searchStr.length; j++) {
        if (buffer[i + j] !== buffer[i + j]) {
            match = false;
            break;
        }
    }
    if (match) count++;
}

console.log('Webhook ID found:', count, 'times');

// Look for workflow names
const workflows = [];
const workflowPattern = /name.*?active.*?triggerCount/s;
const content = buffer.toString('utf8', 0, buffer.length);

// Extract some workflow names
const lines = content.split('\n');
let currentWorkflow = null;
for (const line of lines) {
    if (line.includes('name')) {
        const match = line.match(/"name":"([^"]+)"/);
        if (match) {
            currentWorkflow = match[1];
        }
    }
    if (line.includes('active') && currentWorkflow) {
        const activeMatch = line.match(/"active":(true|false)/);
        if (activeMatch) {
            console.log(`Workflow: ${currentWorkflow}, Active: ${activeMatch[1]}`);
            currentWorkflow = null;
        }
    }
}