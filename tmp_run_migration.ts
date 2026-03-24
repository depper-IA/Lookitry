
import { Client } from 'pg';

async function run() {
  const client = new Client({
    host: 'db.vkdooutklowctuudjnkl.supabase.co',
    port: 5432,
    user: 'postgres',
    password: '***REMOVED-SECRET***',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a PostgreSQL');

    const sql = `
      ALTER TABLE payment_settings
        ADD COLUMN IF NOT EXISTS modal_promo_config JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS modal_title       TEXT,
        ADD COLUMN IF NOT EXISTS modal_description TEXT,
        ADD COLUMN IF NOT EXISTS modal_image_url   TEXT,
        ADD COLUMN IF NOT EXISTS mini_landing_preview_seconds INT DEFAULT 15;

      UPDATE payment_settings
      SET 
        modal_title = COALESCE(modal_title, '¡Oferta Especial!'),
        modal_description = COALESCE(modal_description, 'Obtén un descuento exclusivo registrándote hoy.'),
        mini_landing_preview_seconds = COALESCE(mini_landing_preview_seconds, 15)
      WHERE modal_title IS NULL;
    `;

    console.log('Ejecutando migración...');
    await client.query(sql);
    console.log('Migración completada exitosamente.');

    const { rows } = await client.query('SELECT * FROM payment_settings LIMIT 1');
    console.log('Estado actual de payment_settings:', JSON.stringify(rows[0], null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
