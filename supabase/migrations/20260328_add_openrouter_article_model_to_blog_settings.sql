alter table if exists public.blog_settings
add column if not exists openrouter_article_model text;

alter table if exists public.blog_settings
add column if not exists image_generation_provider text;

update public.blog_settings
set openrouter_article_model = coalesce(openrouter_article_model, 'openrouter/free')
where id = 1;

update public.blog_settings
set image_generation_provider = coalesce(image_generation_provider, 'replicate')
where id = 1;
