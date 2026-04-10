-- WooCommerce DB hardening verification
-- Ejecutar en Supabase SQL Editor sobre produccion.

-- 1. Confirmar que el indice unico exista
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'products'
  and indexname = 'products_brand_external_id_unique_idx';

-- 2. Confirmar que no haya duplicados que rompan el upsert
select
  brand_id,
  external_id,
  count(*) as duplicates
from products
where external_id is not null
group by brand_id, external_id
having count(*) > 1
order by duplicates desc, brand_id, external_id;

-- 3. Confirmar que el arbol de indices del sync este presente
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'products'
  and indexname in (
    'products_brand_external_id_unique_idx',
    'products_external_id_idx'
  )
order by indexname;

-- 4. Muestra rapida de productos WooCommerce mapeados
select
  brand_id,
  external_id,
  is_active,
  updated_at
from products
where external_id is not null
order by updated_at desc
limit 20;

-- Resultado esperado:
-- - Consulta 1 devuelve 1 fila.
-- - Consulta 2 devuelve 0 filas.
-- - Consulta 3 devuelve al menos 1 fila para products_brand_external_id_unique_idx.
