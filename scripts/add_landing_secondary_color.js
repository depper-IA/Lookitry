require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');

async function run() {
    // Para conectar directamente a la base de datos de supabase usamos connection string
    // O podemos ignorar PG y usar supabase rpc pero supongo q no hay rpc para sql
    // Afortunadamente, no necesitamos bd necesariamente si usamos fetch contra la API REST? No, DDL no es REST.
    // La contraseña está en .env
    const pwd = process.env.SUPABASE_DB_PASSWORD;
    const connectionString = `postgresql://postgres:${pwd}@db.vkdooutklowctuudjnkl.supabase.co:5432/postgres`;
    
    const client = new Client({ connectionString });
    try {
        await client.connect();
        await client.query("ALTER TABLE brands ADD COLUMN IF NOT EXISTS landing_secondary_color VARCHAR(50);");
        console.log("Column landing_secondary_color added successfully!");
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        client.end();
    }
}
run();
