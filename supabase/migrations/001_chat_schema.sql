-- ============================================
-- FiscAI Chat Schema Migration
-- ============================================
-- Este script crea las tablas necesarias para el chatbot con Supabase Realtime
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- 1. Tabla de conversaciones
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para búsquedas por usuario
create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversations_created_at_idx on public.conversations(created_at desc);

-- 2. Tabla de mensajes
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user','assistant','system','tool')),
  content text,
  message_type text default 'text',
  payload jsonb,
  status text default 'sent' check (status in ('queued','processing','sent','error')),
  created_at timestamptz not null default now()
);

-- Índices para búsquedas eficientes
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists messages_role_status_idx on public.messages(role, status) where status = 'queued';

-- 3. Trigger para updated_at (si no existe la función)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_conversations_updated_at
  before update on public.conversations
  for each row
  execute function public.update_updated_at_column();

-- 4. Habilitar Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 5. Políticas RLS para conversations
-- Usuarios solo ven sus propias conversaciones
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- 6. Políticas RLS para messages
-- Usuarios ven mensajes de sus conversaciones
create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- Usuarios solo pueden insertar mensajes propios (role='user')
create policy "Users can insert own messages"
  on public.messages for insert
  with check (
    role = 'user'
    and author_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

-- El servicio role puede insertar mensajes del asistente
-- (configurar en Edge Functions con service_role key)

-- 7. Habilitar Realtime para estas tablas
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

-- 8. Comentarios útiles
comment on table public.conversations is 'Conversaciones de chat entre usuarios y el asistente FiscAI';
comment on table public.messages is 'Mensajes individuales dentro de conversaciones';
comment on column public.messages.role is 'user=usuario, assistant=IA, system=sistema, tool=resultado de herramienta';
comment on column public.messages.payload is 'Datos estructurados para tool calls (JSON)';
comment on column public.messages.status is 'Estado del mensaje: queued, processing, sent, error';

-- ============================================
-- Verificación
-- ============================================
-- Ejecutar después para verificar:
-- select tablename from pg_tables where schemaname = 'public' and tablename in ('conversations', 'messages');
-- select schemaname, tablename, policyname from pg_policies where tablename in ('conversations', 'messages');
