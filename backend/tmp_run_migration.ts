
// @ts-ignore
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'db.vkdooutklowctuudjnkl.supabase.co',
    port: 5432,
    user: 'postgres',
    password: '3G9TJHZSShva2rXq',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- Conectado a PostgreSQL ---');

    const sql = `
      ALTER TABLE payment_settings
        ADD COLUMN IF NOT EXISTS modal_promo_config JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS modal_title       TEXT,
        ADD COLUMN IF NOT EXISTS modal_description TEXT,
        ADD COLUMN IF NOT EXISTS modal_image_url   TEXT,
        ADD COLUMN IF NOT EXISTS mini_landing_preview_seconds INT DEFAULT 15;

      -- Actualizar solo si son NULL
      UPDATE payment_settings
      SET 
        modal_title = COALESCE(modal_title, '¡Oferta Especial!'),
        modal_description = COALESCE(modal_description, 'Obtén un descuento exclusivo registrándote hoy.'),
        mini_landing_preview_seconds = COALESCE(mini_landing_preview_seconds, 15);
    `;

    console.log('Ejecutando migración SQL...');
    await client.query(sql);
    console.log('✅ Migración completada exitosamente.');

    const { rows } = await client.query('SELECT * FROM payment_settings LIMIT 1');
    console.log('--- Estado actual de la tabla ---');
    console.log(JSON.stringify({
        modal_title: rows[0].modal_title,
        mini_landing_preview_seconds: rows[0].mini_landing_preview_seconds,
        modal_promo_config: rows[0].modal_promo_config
    }, null, 2));

  } catch (err) {
    console.error('❌ Error en la migración:', err);
  } finally {
    await client.end();
  }
}

run();
