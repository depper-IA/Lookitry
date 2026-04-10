import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const keys = [
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'FRONTEND_URL'
];

console.log('--- Environment Check ---');
keys.forEach(key => {
  const value = process.env[key];
  if (value) {
    console.log(`${key}: [CONFIGURADO] (largo: ${value.length})`);
  } else {
    console.log(`${key}: [FALTANTE]`);
  }
});
console.log('-------------------------');
