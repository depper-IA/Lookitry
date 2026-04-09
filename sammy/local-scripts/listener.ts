import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';
import path from 'node:path';
import dotenv from 'dotenv';

// Load environment from sammy/.env (local)
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan credenciales de Supabase en sammy/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🚀 Sammy Local Bridge inicializado...");
console.log("📡 Escuchando tareas delegadas en tiempo real a través de Supabase [agent_delegations]...");

function spawnOpencodeAgent(agentName: string, prompt: string) {
  // We use the global 'opencode' command on Windows since the PC is active
  // Passing the prompt directly. Escaping might be needed depending on OS.
  console.log(`\n================================`);
  console.log(`🤖 DESPERTANDO AGENTE: @${agentName}`);
  console.log(`📋 TAREA: ${prompt}`);
  console.log(`================================\n`);

  // Start OpenCode in a new detached terminal 
  // Command: start "OpenCode Agent" cmd.exe /C "opencode -a AgentName \"prompt\" & pause"
  const safeAgent = agentName.replace(/[^a-zA-Z0-9_\-]/g, '');
  const child = spawn('cmd.exe', ['/C', 'start', `Sammy Delegation - @${safeAgent}`, 'cmd.exe', '/C', `opencode -a ${safeAgent} "${prompt.replace(/"/g, '\\"')}" & pause`], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref(); // Release node process to keep listening
}

supabase
  .channel('realtime_delegations')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'agent_delegations' },
    async (payload: any) => {
      const { id, target_agent, prompt } = payload.new;
      console.log(`\n🔔 ¡NUEVA ORDEN RECIBIDA DE SAMMY! (ID: ${id})`);
      
      try {
        spawnOpencodeAgent(target_agent, prompt);
        
        // Mark as completed
        await supabase
          .from('agent_delegations')
          .update({ status: 'completed' })
          .eq('id', id);
          
      } catch (error: any) {
        console.error(`❌ Error ejecutando agente ${target_agent}:`, error);
        await supabase
          .from('agent_delegations')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', id);
      }
    }
  )
  .subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Conectado al websocket de Supabase exitosamente.');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Error de conexión con Supabase Realtime');
    }
  });
