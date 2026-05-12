import { supabaseAdmin } from './src/config/supabase';

async function run() {
  const lentesAttrs = [
    { name: 'proteccion_uv', label: 'Protección UV', type: 'text', required: false },
    { name: 'material_marco', label: 'Material del marco', type: 'text', required: false },
    { name: 'color', label: 'Color del lente', type: 'text', required: true }
  ];

  const cascosAttrs = [
    { name: 'talla', label: 'Talla del Casco', type: 'select', options: ['S', 'M', 'L', 'XL'], required: true },
    { name: 'certificacion', label: 'Certificación', type: 'text', required: false },
    { name: 'color', label: 'Color', type: 'text', required: true }
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

  console.log('Done!');
}
run();