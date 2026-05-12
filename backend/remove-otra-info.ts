import { supabaseAdmin } from './src/config/supabase';

async function run() {
  const lentesAttrs = [
    { key: 'forma_marco', label: 'Forma del marco', type: 'select', required: false, options: ['Aviador', 'Cuadrado', 'Redondo', 'Otro'] },
    { key: 'proteccion_uv', label: 'Protección UV', type: 'select', required: false, options: ['UV400', 'Polarizado', 'Otro'] },
    { key: 'material_marco', label: 'Material del marco', type: 'select', required: false, options: ['Metal', 'Acetato', 'Otro'] },
    { key: 'color', label: 'Color del lente', type: 'text', required: true }
  ];

  const cascosAttrs = [
    { key: 'talla', label: 'Talla del Casco', type: 'tags', options: ['S', 'M', 'L', 'XL', 'XXL'], required: true },
    { key: 'certificacion', label: 'Certificación', type: 'select', required: false, options: ['DOT', 'ECE', 'Otro'] },
    { key: 'tipo_visor', label: 'Tipo de visor', type: 'select', required: false, options: ['Transparente', 'Oscuro', 'Otro'] },
    { key: 'color', label: 'Color principal', type: 'text', required: true }
  ];

  console.log('Removing otra_informacion from Lentes...');
  await supabaseAdmin.from('category_attributes').update({
    attributes: lentesAttrs
  }).eq('category_key', 'lentes');

  console.log('Removing otra_informacion from Cascos...');
  await supabaseAdmin.from('category_attributes').update({
    attributes: cascosAttrs
  }).eq('category_key', 'cascos');

  console.log('Done!');
}
run();