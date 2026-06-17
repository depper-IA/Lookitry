const fs = require('fs');
const data = fs.readFileSync('eslint-out.json','utf8');
const results = JSON.parse(data);
results.forEach(r => {
  const errs = r.messages.filter(m => m.severity === 2);
  if (errs.length) {
    const short = r.filePath.replace(/.*backend[/\\]/,'').replace(/\\/g,'/');
    console.log('FILE: ' + short);
    errs.forEach(e => console.log('  L' + e.line + ': [' + e.ruleId + '] ' + e.message));
  }
});
