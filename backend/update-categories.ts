import { supabaseAdmin } from './src/config/supabase';

async function run() {
  const lentesAttrs = [
    { key: 'forma_marco', label: 'Forma del marco', type: 'select', required: false, options: ['Aviador', 'Cuadrado', 'Redondo'] },
    { key: 'proteccion_uv', label: 'Protección UV', type: 'select', required: false, options: ['UV400', 'Polarizado'] },
    { key: 'material_marco', label: 'Material del marco', type: 'select', required: false, options: ['Metal', 'Acetato'] },
    { key: 'color', label: 'Color del lente', type: 'text', required: true }
  ];

  const cascosAttrs = [
    { key: 'talla', label: 'Talla del Casco', type: 'tags', options: ['S', 'M', 'L', 'XL', 'XXL'], required: true },
    { key: 'certificacion', label: 'Certificación', type: 'select', required: false, options: ['DOT', 'ECE'] },
    { key: 'tipo_visor', label: 'Tipo de visor', type: 'select', required: false, options: ['Transparente', 'Oscuro'] },
    { key: 'color', label: 'Color principal', type: 'text', required: true }
  ];

  const otrosAttrs = [
    { key: 'color', label: 'Color', type: 'text', required: false },
    { key: 'marca', label: 'Marca', type: 'text', required: false },
    { key: 'material', label: 'Material', type: 'text', required: false }
  ];

  console.log('Updating Lentes...');
  await supabaseAdmin.from('category_attributes').update({
    attributes: lentesAttrs
  }).eq('category_key', 'lentes');

  console.log('Updating Cascos...');
  await supabaseAdmin.from('category_attributes').update({
    attributes: cascosAttrs
  }).eq('category_key', 'cascos');

  console.log('Updating Otros...');
  await supabaseAdmin.from('category_attributes').update({
    attributes: otrosAttrs
  }).eq('category_key', 'other');

  console.log('Done!');
}
run();