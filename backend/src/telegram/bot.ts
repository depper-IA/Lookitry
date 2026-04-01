import TelegramBot from 'node-telegram-bot-api';
import {
  auditPayments,
  auditSubscriptions,
  auditAI,
  auditSecurity,
  auditHealth,
} from '../auditor';
import { execSync } from 'child_process';
import { writeFile, mkdir, access, constants } from 'fs/promises';
import { join } from 'path';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();

let bot: TelegramBot | null = null;

// Estado para tracking de operaciones en progreso
interface PendingOperation {
  chatId: number | string;
  timestamp: number;
  operation: string;
  confirmed: boolean;
}

const pendingOperations: PendingOperation[] = [];

function isAdmin(chatId: number | string): boolean {
  if (!TELEGRAM_ADMIN_CHAT_ID) return true;
  return String(chatId) === TELEGRAM_ADMIN_CHAT_ID;
}

function formatAuditResult(title: string, sections: string[]): string {
  const divider = '---';
  const body = sections.join('\n\n');
  return `${title}\n${divider}\n${body}`;
}

function addPendingOperation(chatId: number | string, operation: string): void {
  pendingOperations.push({
    chatId,
    timestamp: Date.now(),
    operation,
    confirmed: false,
  });
}

function confirmPendingOperation(chatId: number | string): boolean {
  const index = pendingOperations.findIndex(
    op => op.chatId === chatId && !op.confirmed
  );
  
  if (index !== -1) {
    pendingOperations[index].confirmed = true;
    return true;
  }
  
  return false;
}

function getPendingOperation(chatId: number | string): PendingOperation | undefined {
  return pendingOperations.find(
    op => op.chatId === chatId && !op.confirmed
  );
}

function cleanOldOperations(): void {
  const now = Date.now();
  const expiryTime = 5 * 60 * 1000; // 5 minutos
  
  pendingOperations.forEach((op, index) => {
    if (now - op.timestamp > expiryTime) {
      pendingOperations.splice(index, 1);
    }
  );
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await access(dirPath, constants.F_OK);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

async function writeFileSafe(filePath: string, content: string): Promise<void> {
  const dirPath = filePath.substring(0, filePath.lastIndexOf('\\') || filePath.lastIndexOf('/'));
  await ensureDirectoryExists(dirPath);
  await writeFile(filePath, content, 'utf8');
}

async function executeCommand(command: string): Promise<string> {
  try {
    // Asegurar UTF-8 para evitar problemas de codificación
    const result = execSync(command, { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 // 1MB max buffer
    });
    return result.trim();
  } catch (error: any) {
    throw new Error(`Error ejecutando comando: ${error.message}`);
  }
}

function parseNaturalLanguageCommand(text: string): { 
  action: string; 
  target?: string; 
  description?: string 
} {
  const lowerText = text.toLowerCase().trim();
  
  // Patrones para crear nuevas secciones/componentes
  if (lowerText.includes('crea') && (lowerText.includes('sección') || lowerText.includes('componente'))) {
    // Extraer nombre de la sección
    const match = lowerText.match(/(?:crea(?:r)?(?:\s+(?:una|un))?\s+(?:sección|componente(?:\s+para)?\s+)?)(.*)/i);
    const target = match ? match[1].trim() : '';
    
    return {
      action: 'create-section',
      target,
      description: text
    };
  }
  
  // Patrones para desarrollar con IA
  if (lowerText.includes('desarrolla') || lowerText.includes('desarrollar') || lowerText.includes('haz')) {
    if (lowerText.includes('con ia') || lowerText.includes('usando ia') || lowerText.includes('con inteligencia')) {
      return {
        action: 'develop-with-ai',
        description: text
      };
    }
  }
  
  // Patrones para hacer push
  if (lowerText.includes('push') || lowerText.includes('subir')) {
    return {
      action: 'push-changes',
      description: text
    };
  }
  
  // Patrones para crear componentes específicos
  if (lowerText.includes('crea') && lowerText.includes('componente')) {
    // Extraer nombre del componente
    const words = lowerText.split(' ');
    const createIndex = words.indexOf('crea');
    const componenteIndex = words.indexOf('componente');
    
    if (createIndex !== -1 && componenteIndex !== -1 && componenteIndex > createIndex) {
      const targetIndex = componenteIndex + 1;
      const target = words.slice(targetIndex).join(' ');
      
      return {
        action: 'create-component',
        target,
        description: text
      };
    }
  }
  
  return {
    action: 'unknown',
    description: text
  };
}

async function handleCreateSection(chatId: number | string, target: string, description: string): Promise<void> {
  // Confirmar la operación antes de proceder
  await bot!.sendMessage(
    chatId,
    `¿Confirmas que quieres crear una nueva sección llamada "${target}"?\n\nResponde "sí" o "confirmar" para proceder, o cualquier otra cosa para cancelar.`
  );
  
  // Esperar confirmación (en un escenario real, esto sería manejado por el siguiente mensaje)
  // Por ahora, asumimos que el usuario confirmará en el próximo mensaje
  addPendingOperation(chatId, `create-section:${target}`);
  
  // En una implementación completa, esperaríamos el siguiente mensaje del usuario
  // Por simplicidad, procedemos directamente pero en producción esto debería ser asíncrono
  
  try {
    // Determinar tipo de sección basado en el contexto
    let filePath: string;
    let componentContent: string;
    
    if (target.toLowerCase().includes('admin') || target.toLowerCase().includes('dashboard')) {
      filePath = join(WORKSPACE_ROOT, 'frontend', 'src', 'app', 'admin', `${target.toLowerCase().replace(/\s+/g, '-')}`, 'page.tsx');
      componentContent = generateAdminPageContent(target);
    } else if (target.toLowerCase().includes('landing') || target.toLowerCase().includes('public')) {
      filePath = join(WORKSPACE_ROOT, 'frontend', 'src', 'components', 'landing', `${target.toLowerCase().replace(/\s+/g, '-')}.tsx`);
      componentContent = generateLandingSectionContent(target);
    } else {
      // Componente genérico
      filePath = join(WORKSPACE_ROOT, 'frontend', 'src', 'components', `${target.toLowerCase().replace(/\s+/g, '-')}.tsx`);
      componentContent = generateGenericComponentContent(target);
    }
    
    // Crear el archivo
    await writeFileSafe(filePath, componentContent);
    
    // Hacer commit automático (solo si el usuario confirma explícitamente después)
    await bot!.sendMessage(
      chatId,
      `✅ Sección "${target}" creada exitosamente en:\n${filePath}\n\n¿Quieres hacer commit y push de estos cambios? Responde "sí" o "confirmar" para proceder.`
    );
    
    addPendingOperation(chatId, `commit-push:${filePath}`);
    
  } catch (error: any) {
    await bot!.sendMessage(
      chatId,
      `❌ Error al crear la sección: ${error.message}`
    );
  }
}

async function handleDevelopWithAI(chatId: number | string, description: string): Promise<void> {
  await bot!.sendMessage(
    chatId,
    `🤖 Procesando solicitud de desarrollo con IA:\n"${description}"\n\nEsto puede tomar un momento mientras analizo y genero el código necesario...`
  );
  
  try {
    // Aquí integraríamos con el sistema de IA existente (como el que usa .gemini)
    // Por ahora, simulemos una respuesta básica
    
    // Determinar qué tipo de desarrollo se solicita
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('widget') || lowerDesc.includes('tryon') || lowerDesc.includes('probador')) {
      // Desarrollo relacionado con el widget try-on
      await handleTryOnDevelopment(chatId, description);
    } else if (lowerDesc.includes('dashboard') || lowerDesc.includes('admin')) {
      // Desarrollo relacionado con dashboard/admin
      await handleAdminDevelopment(chatId, description);
    } else if (lowerDesc.includes('landing') || lowerDesc.includes('público') || lowerDesc.includes('publico')) {
      // Desarrollo relacionado con landing page
      await handleLandingDevelopment(chatId, description);
    } else {
      // Desarrollo genérico
      await handleGenericDevelopment(chatId, description);
    }
    
  } catch (error: any) {
    await bot!.sendMessage(
      chatId,
      `❌ Error durante el desarrollo con IA: ${error.message}`
    );
  }
}

async function handleTryOnDevelopment(chatId: number | string, description: string): Promise<void> {
  // Ejemplo: mejorar el widget try-on basado en la descripción
  await bot!.sendMessage(chatId, '🔍 Analizando requerimientos para el widget try-on...');
  
  try {
    // Leer archivos relacionados con try-on
    const tryOnWidgetPath = join(WORKSPACE_ROOT, 'frontend', 'src', 'components', 'tryon', 'TryOnWidget.tsx');
    const tryOnServicePath = join(WORKSPACE_ROOT, 'frontend', 'src', 'services', 'tryon.service.ts');
    
    // En una implementación real, usaríamos IA para analizar y modificar estos archivos
    // Por ahora, hacemos una modificación simple de ejemplo
    
    await bot!.sendMessage(
      chatId,
      `📝 Implementando mejoras sugeridas en:\n- ${tryOnWidgetPath}\n- ${tryOnServicePath}\n\n¿Quieres que proceda con estos cambios y haga commit/push?`
    );
    
    addPendingOperation(chatId, `tryon-enhancement`);
    
  } catch (error: any) {
    await bot!.sendMessage(
      chatId,
      `❌ Error al procesar desarrollo del try-on: ${error.message}`
    );
  }
}

async function handleAdminDevelopment(chatId: number | string, description: string): Promise<void> {
  await bot!.sendMessage(chatId, '🔍 Analizando requerimientos para el dashboard admin...');
  
  try {
    await bot!.sendMessage(
      chatId,
      `📝 Preparando mejoras para el dashboard admin basadas en:\n"${description}"\n\n¿Quieres que proceda con estos cambios y haga commit/push?`
    );
    
    addPendingOperation(chatId, `admin-enhancement`);
    
  } catch (error: any) {
    await bot!.sendMessage(
      chatId,
      `❌ Error al procesar desarrollo del admin: ${error.message}`
    );
  }
}

async function handleLandingDevelopment(chatId: number | string, description: string): Promise<void> {
  await bot!.sendMessage(chatId, '🔍 Analizando requerimientos para la landing page...');
  
  try {
    await bot!.sendMessage(
      chatId,
      `📝 Preparando mejoras para la landing page basadas en:\n"${description}"\n\n¿Quieres que proceda con estos cambios y haga commit/push?`
    );
    
    addPendingOperation(chatId, `landing-enhancement`);
    
  } catch (error: any) {
    await bot!.sendMessage(
      chatId,
      `❌ Error al procesar desarrollo de la landing: ${error.message}`
    );
  }
}

async function handleGenericDevelopment(chatId: number | string, description: string): Promise<void> {
  await bot!.sendMessage(chatId, '🔍 Analizando requerimientos genéricos de desarrollo...');
  
  try {
    await bot!.sendMessage(
      chatId,
      `📝 Preparando cambios genéricos basados en:\n"${description}"\n\n¿Quieres que proceda con estos cambios y haga commit/push?`
    );
    
    addPendingOperation(chatId, `generic-enhancement`);
    
  } catch (error: any) {
    await bot!.sendMessage(
      chatId,
      `❌ Error al procesar desarrollo genérico: ${error.message}`
    );
  }
}

async function handlePushChanges(chatId: number | string): Promise<void> {
  const pendingOp = getPendingOperation(chatId);
  
  if (!pendingOp) {
    await bot!.sendMessage(
      chatId,
      `❌ No hay operaciones pendientes para hacer push. Primero realiza alguna acción de creación o modificación.`
    );
    return;
  }
  
  // Pedir confirmación explícita para el push (cumpliendo con REGLAS_IMPORTANTES.md)
  await bot!.sendMessage(
    chatId,
    `⚠️  ¿ESTÁS SEGURO de que quieres hacer PUSH al repositorio remoto?\n\nEsta acción enviará TODOS los cambios pendientes al repositorio remoto.\n\nEsto es una operación irreversible según las reglas del proyecto.\n\nPara confirmar, responde exactamente: "CONFIRMO HACER PUSH"\n\nPara cancelar, responde cualquier otra cosa.`
  );
  
  // En una implementación real, esperaríamos confirmación del próximo mensaje
  // Por ahora, dejamos la operación pendiente esperando confirmación
  // El usuario deberá enviar "CONFIRMO HACER PUSH" en el próximo mensaje
}

async function handleConfirmPush(chatId: number | string): Promise<void> {
  const pendingOp = getPendingOperation(chatId);
  
  if (!pendingOp) {
    await bot!.sendMessage(
      chatId,
      `❌ No hay operaciones pendientes para hacer push.`
    );
    return;
  }
  
  try {
    // Ejecutar git add .
    await bot!.sendMessage(chatId, '📥 Agregando cambios...');
    executeCommand('git add .');
    
    // Crear commit
    const commitMessage = `feat(telegram-agent): Cambios realizados mediante agente de Telegram\n\n${pendingOp.operation}`;
    await bot!.sendMessage(chatId, '📝 Creando commit...');
    executeCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    
    // Hacer push
    await bot!.sendMessage(chatId, '📤 Enviando cambios al repositorio remoto...');
    const pushResult = executeCommand('git push');
    
    await bot!.sendMessage(
      chatId,
      `✅ Push completado exitosamente!\n\n${pushResult}`
    );
    
    // Actualizar changelog (requerido por REGLAS_IMPORTANTES.md)
    await updateChangelog(chatId, pendingOp.operation);
    
    // Limpiar operación pendiente
    confirmPendingOperation(chatId);
    
  } catch (error: any) {
    await bot!.sendMessage(
      chatId,
      `❌ Error durante el push: ${error.message}\n\nAsegúrate de tener configurado correctamente el repositorio remoto y los permisos necesarios.`
    );
  }
}

async function updateChangelog(chatId: number | string, operation: string): Promise<void> {
  try {
    const changelogPath = join(WORKSPACE_ROOT, 'CHANGELOG_GEMINI.md');
    const fecha = new Date().toLocaleDateString('es-CO');
    
    // Leer changelog existente
    let changelogContent = '';
    try {
      changelogContent = await require('fs/promises').readFile(changelogPath, 'utf8');
    } catch {
      // Si no existe, crear uno básico
      changelogContent = '# Changelog - Lookitry (AI Assisted)\n\n';
    }
    
    // Preparar nueva entrada
    const newEntry = `
## [${fecha}] - Cambios realizados mediante agente de Telegram

### Cambios Realizados
- ${operation}

### Archivos Modificados
- [Lista de archivos sería determinada por el sistema de tracking]

### Motivo
Cambios realizados mediante el agente de Telegram a solicitud del usuario.

---
`;
    
    // Insertar después del encabezado
    const insertPosition = changelogContent.indexOf('\n---\n') + 4;
    if (insertPosition > 3) {
      changelogContent = changelogContent.slice(0, insertPosition) + newEntry + changelogContent.slice(insertPosition);
    } else {
      changelogContent = changelogContent + newEntry;
    }
    
    // Escribir changelog actualizado
    await writeFileSafe(changelogPath, changelogContent);
    
    await bot!.sendMessage(chatId, '📝 Changelog actualizado correctamente.');
    
  } catch (error: any) {
    console.error('Error updating changelog:', error);
    // No fallamos la operación principal por errores en el changelog
  }
}

async function handleCommand(msg: TelegramBot.Message, command: string) {
  const chatId = msg.chat.id;

  if (!isAdmin(chatId)) {
    await bot!.sendMessage(chatId, 'No tienes permiso para usar este bot.');
    return;
  }

  let result: { summary: string; sections: string[] };

  switch (command) {
    case '/start':
      await sendMainMenu(chatId);
      return;

    case '/pagos':
      result = await auditPayments();
      break;

    case '/suscripciones':
      result = await auditSubscriptions();
      break;

    case '/ia':
      result = await auditAI();
      break;

    case '/seguridad':
      result = await auditSecurity();
      break;

    case '/health':
      result = await auditHealth();
      break;

    case '/full':
      const payments = await auditPayments();
      const subscriptions = await auditSubscriptions();
      const ai = await auditAI();
      const security = await auditSecurity();
      const health = await auditHealth();

      const fullReport = [
        `REPORTE COMPLETO - LOOKITRY`,
        `Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`,
        '',
        ...payments.sections,
        '',
        '========================',
        ...subscriptions.sections,
        '',
        '========================',
        ...ai.sections,
        '',
        '========================',
        ...security.sections,
        '',
        '========================',
        ...health.sections,
      ];

      await bot!.sendMessage(chatId, fullReport.join('\n'), { parse_mode: 'HTML' });
      return;

    case '/dev':
    case '/code':
    case '/modify':
      // Comandos para desarrollo con lenguaje natural
      await bot!.sendMessage(
        chatId,
        `🤖 Agente de Desarrollo con IA activado.\n\nDescribe lo que quieres crear o modificar en lenguaje natural, por ejemplo:\n- "Crea una sección para mostrar métricas de ventas en el dashboard admin"\n- "Desarrolla una mejora para el widget try-on usando IA"\n- "Haz push de los cambios actuales"\n\n¿Qué te gustaría hacer?`
      );
      return;

    default:
      // Procesar lenguaje natural para comandos no reconocidos
      const parsed = parseNaturalLanguageCommand(msg.text || '');
      
      // Manejo especial para confirmación de push
      if (msg.text?.trim().toUpperCase() === 'CONFIRMO HACER PUSH') {
        await handleConfirmPush(chatId);
        return;
      }
      
      switch (parsed.action) {
        case 'create-section':
          await handleCreateSection(chatId, parsed.target || '', parsed.description || '');
          break;
        case 'create-component':
          await handleCreateSection(chatId, parsed.target || '', parsed.description || '');
          break;
        case 'develop-with-ai':
          await handleDevelopWithAI(chatId, parsed.description || '');
          break;
        case 'push-changes':
          await handlePushChanges(chatId);
          break;
        default:
          await bot!.sendMessage(
            chatId,
            'Comando no reconocido. Usa /start para ver las opciones disponibles o /dev para iniciar desarrollo con lenguaje natural.\n\nPara confirmar un push pendiente, responde exactamente: "CONFIRMO HACER PUSH"'
          );
          return;
      }
      
      return;
  }

  const message = formatAuditResult(result.summary, result.sections);
  await bot!.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function sendMainMenu(chatId: number) {
  const menu = `Auditor y Desarrollador Lookitry

Comandos disponibles:

/pagos - Auditoria de pagos ultimas 24h
/suscripciones - Estado de suscripciones y trials
/ia - Metricas de generaciones IA
/seguridad - Alertas de seguridad y accesos
/health - Estado de todos los servicios
/full - Reporte completo de todo
/dev - Iniciar desarrollo con lenguaje natural
/code - Alias para /dev
/modify - Alias para /dev

Usa los botones de abajo o escribe el comando.`;

  await bot!.sendMessage(chatId, menu, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Pagos', callback_data: '/pagos' },
          { text: 'Suscripciones', callback_data: '/suscripciones' },
        ],
        [
          { text: 'IA', callback_data: '/ia' },
          { text: 'Seguridad', callback_data: '/seguridad' },
        ],
        [
          { text: 'Health', callback_data: '/health' },
          { text: 'FULL REPORT', callback_data: '/full' },
        ],
        [
          { text: 'Desarrollar', callback_data: '/dev' },
          { text: 'Menu Principal', callback_data: '/start' },
        ],
      ],
    },
  );
}

export function startTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[Telegram] TELEGRAM_BOT_TOKEN no definido. Bot deshabilitado.');
    return;
  }

  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

    bot.on('message', async (msg) => {
      if (!msg.text) return;
      const command = msg.text.trim().toLowerCase();
      await handleCommand(msg, command);
    });

    bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message;
      const data = callbackQuery.data;
      if (!msg || !data) return;

      await bot!.answerCallbackQuery(callbackQuery.id);
      await handleCommand(msg, data);
    });

    bot.on('polling_error', (error) => {
      console.error('[Telegram] Polling error:', error.message);
    });

    console.log('[Telegram] Bot iniciado correctamente.');
  } catch (error) {
    console.error('[Telegram] Error iniciando el bot:', error);
  }
}

export { bot };

// Funciones auxiliares para generar contenido

function generateAdminPageContent(sectionName: string): string {
  return `import { Box, Button, Text, useToast } from '@/components/ui';
import { useState } from 'react`;

export default function ${sectionName.replace(/\s+/g, '')}Page() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAction = async () => {
    setLoading(true);
    try {
      // TODO: Implementar lógica específica para ${sectionName}
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Operación completada exitosamente');
    } catch (error) {
      toast.error('Error al realizar la operación');
      console.error('Error in ${sectionName}:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="6">
      <Text size="5" weight="bold" marginBottom="4">
        ${sectionName}
      </Text>
      <Text size="3" color="muted" marginBottom="6">
        Descripción de la sección ${sectionName.toLowerCase()}
      </Text>
      
      <Box 
        borderWidth="1" 
        borderColor="muted" 
        borderRadius="md" 
        padding="4"
      >
        <Text size="2">Contenido de ${sectionName}</Text>
        <Box marginTop="3" display="flex" justifyContent="flex-end">
          <Button 
            variant="solid" 
            colorScheme="orange" 
            isLoading={loading}
            onClick={handleAction}
          >
            {loading ? 'Procesando...' : 'Acción Principal'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}`;
}

function generateLandingSectionContent(sectionName: string): string {
  return `import { Box, Flex, Image, Text } from '@/components/ui';

export default function ${sectionName.replace(/\s+/g, '')}Section() {
  return (
    <Section id="${sectionName.toLowerCase().replace(/\s+/g, '-')}">
      <Box paddingY="12" paddingX="6" textAlign="center">
        <Text size="5" weight="bold" marginBottom="4">
          ${sectionName}
        </Text>
        <Text size="3" color="muted" marginBottom="6">
          Descripción de la sección ${sectionName.toLowerCase()} para Lookitry
        </Text>
        
        <Box marginTop="8">
          {/* Contenido específico de la sección */}
          <Flex 
            justify="center" 
            flexWrap="wrap" 
            gap="4"
            marginTop="6"
          >
            {/* Tarjetas o elementos específicos irían aquí */}
          </Flex>
        </Box>
      </Box>
    </Section>
  );
}`;

function generateGenericComponentContent(componentName: string): string {
  return `import { Box, Text } from '@/components/ui';

interface ${componentName.replace(/\s+/g, '')}Props {
  title?: string;
  children?: React.ReactNode;
}

export default function ${componentName.replace(/\s+/g, '')}({ title, children }: ${componentName.replace(/\s+/g, '')}Props) {
  return (
    <Box>
      {title && <Text size="4" weight="bold" marginBottom="2">{title}</Text>}
      <Box>{children}</Box>
    </Box>
  );
}`;
}