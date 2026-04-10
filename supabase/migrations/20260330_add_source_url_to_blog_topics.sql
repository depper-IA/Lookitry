alter table if exists public.blog_topics
  add column if not exists source_url text;

comment on column public.blog_topics.source_url is
  'Fuente de investigacion usada por el workflow n8n de generacion de blog.';
