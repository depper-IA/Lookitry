import { supabaseAdmin } from './src/config/supabase';

async function run() {
  const bolsosAttrs = [
    { key: 'tipo_bolso', label: 'Tipo de bolso', type: 'select', required: true, options: ['Mochila', 'Tote', 'Bandolera', 'Cartera', 'Riñonera', 'Otro'] },
    { key: 'material', label: 'Material principal', type: 'select', required: true, options: ['Cuero', 'Sintético', 'Lona', 'Nylon', 'Otro'] },
    { key: 'color', label: 'Color principal', type: 'text', required: true },
    { key: 'marca', label: 'Marca', type: 'text', required: false }
  ];

  console.log('Upserting Bolsos y Carteras...');
  await supabaseAdmin.from('category_attributes').upsert({
    category_key: 'bolsos',
    category_label: 'Bolsos y Carteras',
    attributes: bolsosAttrs
  });

  console.log('Done!');
}
run();