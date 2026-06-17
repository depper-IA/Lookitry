const data = require('fs').readFileSync('eslint-out.json','utf8');
const r = JSON.parse(data);
const errs = [];
r.forEach(x => {
  x.messages.filter(m => m.severity === 2 && m.ruleId === 'no-useless-escape').forEach(m => {
    errs.push({ file: x.filePath.replace(/.*backend[/\\]/,'').replace(/\\/g,'/'), line: m.line, msg: m.message });
  });
});
console.log(JSON.stringify(errs, null, 2));
