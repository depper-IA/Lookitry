const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkColumns() {
  console.log('🔍 Analizando estructura de tabla "brands"...');
  
  const { data, error } = await supabase.from('brands').select('*').limit(1);
  
  if (error) {
    console.error('❌ Error al consultar Supabase:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No hay registros en la tabla "brands".');
    return;
  }

  const columns = Object.keys(data[0]);
  console.log('\n✅ Columnas encontradas:');
  console.log(columns.sort().join('\n'));

  const expectedFields = [
    'slogan', 'brand_description', 'whatsapp_contact', 'whatsapp_message', 
    'cta_button_text', 'logo_light', 'logo_dark', 'cover_bg_color', 
    'cover_overlay_opacity', 'city_display', 'national_shipping', 
    'show_brand_name', 'landing_template', 'rating', 'total_reviews', 
    'header_color', 'schedule'
  ];

  console.log('\n🚀 Verificando campos críticos para mini-landing:');
  expectedFields.forEach(field => {
    if (columns.includes(field)) {
      console.log(`[OK] ${field}`);
    } else {
      console.log(`[FALTA] ${field} <--- POSIBLE CAUSA DEL ERROR 500`);
    }
  });
}

checkColumns();
