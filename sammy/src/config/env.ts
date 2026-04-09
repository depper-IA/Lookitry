import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_ALLOWED_USER_IDS: z.string().optional().transform((val) => 
    val ? val.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : []
  ),
  GROQ_API_KEY: z.string().optional(),
  MINIMAX_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  DB_PATH: z.string().default('./memory.db'),
  MAX_AGENT_ITERATIONS: z.coerce.number().default(10),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PROJECT_ROOT: z.string().default(process.cwd()),
  API_BASE_URL: z.string().default('https://api.lookitry.com'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;