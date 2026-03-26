alter table public.generations
add column if not exists input_fingerprint text;

create unique index if not exists generations_brand_product_input_success_idx
on public.generations (brand_id, product_id, input_fingerprint)
where status = 'SUCCESS'
  and input_fingerprint is not null;
