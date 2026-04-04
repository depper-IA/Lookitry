-- Google Auth: hacer password nullable y agregar columnas para auth social
-- Esto permite que usuarios de Google inicien sesión sin contraseña

-- 1. Hacer password nullable (usuarios Google no tienen contraseña)
ALTER TABLE brands ALTER COLUMN password DROP NOT NULL;

-- 2. Agregar google_id para identificar cuentas de Google
ALTER TABLE brands ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- 3. Agregar auth_provider para saber cómo se autenticó el usuario
ALTER TABLE brands ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- 4. Agregar flag de onboarding pendiente para cuentas Google nuevas
ALTER TABLE brands ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN DEFAULT false;

-- 5. Índice para búsquedas por google_id
CREATE INDEX IF NOT EXISTS idx_brands_google_id ON brands(google_id) WHERE google_id IS NOT NULL;

-- 6. Índice para auth_provider
CREATE INDEX IF NOT EXISTS idx_brands_auth_provider ON brands(auth_provider);
