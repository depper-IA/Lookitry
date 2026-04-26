import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno del backend (desde src/scripts)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  // 1. Listar las 10 marcas más recientes para identificar la del usuario
  const { data: brands, error: brandError } = await supabase
    .from('brands')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (brandError || !brands || brands.length === 0) {
    console.error('Error al listar marcas:', brandError?.message);
    process.exit(1);
  }

  console.log(`\nÑltimas 10 marcas registradas:`);
  let targetBrandId: string | null = null;
  
  for (const b of brands) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', b.id);
      
    console.log(`- ${b.name} (Slug: ${b.slug}) | ID: ${b.id} | Productos: ${count}`);
    if (b.slug === 'probando' || b.name.toLowerCase().includes('lookitry')) {
        targetBrandId = b.id;
    }
  }

  // Si el usuario mencionó "Harley" o algo así, busquemos productos con ese nombre
  console.log(`\nBuscando productos "Harley"...`);
  const { data: searchProds } = await supabase
    .from('products')
    .select('brand_id, name, is_active, external_id')
    .ilike('name', '%Harley%');

  if (searchProds && searchProds.length > 0) {
    console.log(`Encontrados ${searchProds.length} productos con "Harley":`);
    for (const p of searchProds) {
        const b = brands.find(brand => brand.id === p.brand_id);
        console.log(`  - Name: ${p.name} | Active: ${p.is_active} | External: ${p.external_id} | BrandID: ${p.brand_id} ${b ? `(Marca: ${b.name})` : ''}`);
        if (!targetBrandId) targetBrandId = p.brand_id;
    }
  }

  if (targetBrandId) {
    console.log(`\nDetalle de productos para Brand ID: ${targetBrandId}`);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, external_id, is_active, image_url')
      .eq('brand_id', targetBrandId);

    if (prodError) {
      console.error('Error al obtener productos:', prodError.message);
    } else {
      products?.forEach((p: any) => {
        console.log(`- [${p.is_active ? 'ACTIVO' : 'INACTIVO'}] ID: ${p.id} | External: ${p.external_id} | Name: ${p.name} | IMG: ${p.image_url}`);
      });
    }
  }
}

checkProducts();
