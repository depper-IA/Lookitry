const fs = require('fs');
let content = fs.readFileSync('c:/Users/Matt/Lookitry/frontend/src/components/dashboard/SettingsForm.tsx', 'utf8');

content = content.replace(/'Slug de URL personalizado',/g, "'Slug y Mensaje de Bienvenida',");
content = content.replace(/'Mensajes editoriales custom',/g, "'CTA 100% dinámicos',");
content = content.replace(/'CTA 100% dinámicos',\s*'Templates Side Panel y Bold',/g, "'Todas las plantillas incl. Bold',\n                                   'Control total de branding',");
content = content.replace(/'Prioridad IA \(Zero Wait\)',/g, "\\ generaciones mensuales\,");
content = content.replace(/>\\\</g, ">{proPrice ? \\\$\\\k\\\ : '\\'}<");

fs.writeFileSync('c:/Users/Matt/Lookitry/frontend/src/components/dashboard/SettingsForm.tsx', content, 'utf8');
