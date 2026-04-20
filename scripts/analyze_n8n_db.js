const fs = require('fs');
const dbPath = '/home/node/.n8n/database.sqlite';
const db = fs.readFileSync(dbPath);
const str = db.toString('utf8');

// Find Lookitry workflows
const lookitryWorkflows = [
    'wPLypk7KhBcFLicX', // Virtual Try-On
    'ZjVTV3QxoPEi60GX', // Describir con IA
    'PNri7NdZYkZhpPnm', // Error Handler
    'VMAu93Zx4k5qgzdm', // Article Producer
    'l4Mb3wMfHUnsbEXH', // Blog Images
    'ki3eHJ71ca8Jcnw1', // Project Knowledge RAG
    'VM2s3cTQslinhJBx', // NotebookLM
    'ryoA7wq7WhXYUckC'  // Topic Generator
];

console.log('=== Lookitry Workflows in n8n DB ===');
console.log('Database size:', Math.round(db.length / 1024 / 1024), 'MB\n');

lookitryWorkflows.forEach(id => {
    const count = (str.match(new RegExp(id, 'g')) || []).length;
    console.log(`Workflow ${id}: ${count} occurrences`);
});

// Find prompts in workflow data
const promptPatterns = [
    { name: 'NEGATIVE_PROMPT', pattern: /NEGATIVE_PROMPT[^"]*/ },
    { name: 'Replace only', pattern: /Replace only[^"]*/ },
    { name: 'KEEP the person', pattern: /KEEP the person[^"]*/ },
    { name: 'DO NOT', pattern: /DO NOT[^"]*/ }
];

console.log('\n=== Prompt Protection Patterns ===');
promptPatterns.forEach(({ name, pattern }) => {
    const matches = str.match(pattern);
    if (matches && matches.length > 0) {
        console.log(`${name}: Found ${matches.length} occurrences`);
        console.log(`  Example: ${matches[0].substring(0, 80)}...`);
    } else {
        console.log(`${name}: Not found`);
    }
});

// Check for potential injection keywords
const injectionKeywords = ['system:', 'assistant:', 'ignore previous', 'disregard', 'forget instructions'];
console.log('\n=== Potential Injection Keywords ===');
injectionKeywords.forEach(keyword => {
    const count = (str.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    console.log(`"${keyword}": ${count} occurrences`);
});

console.log('\n=== Database Analysis Complete ===');