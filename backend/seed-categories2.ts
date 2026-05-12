import { supabaseAdmin } from './src/config/supabase';

async function run() {
  const lentesAttrs = [
    { key: 'forma_marco', label: 'Forma del marco', type: 'text', required: false, options: ['Aviador', 'Cuadrado', 'Redondo'] },
    { key: 'proteccion_uv', label: 'Protección UV', type: 'text', required: false, options: ['UV400', 'Polarizado'] },
    { key: 'material_marco', label: 'Material del marco', type: 'text', required: false, options: ['Metal', 'Acetato'] },
    { key: 'color', label: 'Color del lente', type: 'text', required: true }
  ];

  const cascosAttrs = [
    { key: 'talla', label: 'Talla del Casco', type: 'tags', options: ['S', 'M', 'L', 'XL', 'XXL'], required: true },
    { key: 'certificacion', label: 'Certificación', type: 'text', required: false, options: ['DOT', 'ECE'] },
    { key: 'tipo_visor', label: 'Tipo de visor', type: 'text', required: false, options: ['Transparente', 'Oscuro'] },
    { key: 'color', label: 'Color principal', type: 'text', required: true }
  ];

  const otrosAttrs = [
    { key: 'color', label: 'Color', type: 'text', required: false },
    { key: 'marca', label: 'Marca', type: 'text', required: false },
    { key: 'material', label: 'Material', type: 'text', required: false }
  ];

  console.log('Upserting Lentes...');
  await supabaseAdmin.from('category_attributes').upsert({
    category_key: 'lentes',
    category_label: 'Lentes',
    attributes: lentesAttrs
  });

  console.log('Upserting Cascos...');
  await supabaseAdmin.from('category_attributes').upsert({
    category_key: 'cascos',
    category_label: 'Cascos',
    attributes: cascosAttrs
  });

  console.log('Upserting Otros...');
  await supabaseAdmin.from('category_attributes').upsert({
    category_key: 'other',
    category_label: 'Otros',
    attributes: otrosAttrs
  });

  console.log('Done!');
}
run();