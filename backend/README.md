# Lookitry SaaS — Backend

API REST construida con Express + TypeScript. Gestiona autenticación, productos, generaciones de try-on, suscripciones y pagos.

## Requisitos

- Node.js >= 18
- npm >= 9
- Cuenta en Supabase
- Instancia de n8n con webhook configurado

## Instalación local

```bash
cd backend
pnpm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Compilar TypeScript a `dist/` |
| `npm start` | Iniciar servidor compilado (`node dist/index.js`) |
| `npm run lint` | Verificar código con ESLint |
| `npm test` | Ejecutar tests con Jest |

## Variables de entorno

Copiar `.env.example` a `.env` y completar todos los valores. Ver el archivo para descripción de cada variable.

---

## Deploy en Hostinger — Backend (Node.js)

### Requisitos previos en Hostinger

- Plan de hosting con soporte Node.js (VPS o Business Hosting)
- Acceso SSH al servidor
- PM2 instalado globalmente: `pnpm install -g pm2`

### Pasos de deploy

**1. Subir el código al servidor**

```bash
# Opción A: clonar desde Git
git clone https://github.com/tu-usuario/tu-repo.git /home/usuario/virtual-tryon
cd /home/usuario/virtual-tryon/backend

# Opción B: subir por SFTP (FileZilla u otro cliente)
# Subir la carpeta backend/ excluyendo node_modules/ y dist/
```

**2. Instalar dependencias de producción**

```bash
cd /home/usuario/virtual-tryon/backend
pnpm install --production
```

**3. Configurar variables de entorno**

```bash
cp .env.example .env
nano .env
# Completar todos los valores con credenciales de producción:
# - NODE_ENV=production
# - FRONTEND_URL=https://tu-dominio.com
# - CORS_ORIGIN=https://tu-dominio.com
# - JWT_SECRET=<clave segura aleatoria>
# - Credenciales de Supabase, n8n, SMTP, Wompi
```

**4. Compilar TypeScript**

```bash
npm run build
# Genera la carpeta dist/ con el código compilado
```

**5. Configurar PM2 para mantener el proceso activo**

```bash
# Iniciar la aplicación con PM2
pm2 start dist/index.js --name virtual-tryon-backend

# Guardar la configuración para que reinicie al reboot
pm2 save
pm2 startup

# Verificar que está corriendo
pm2 status
pm2 logs virtual-tryon-backend
```

**6. Configurar el puerto en Hostinger**

En el panel de Hostinger, configurar el proxy inverso (Nginx) para redirigir el dominio/subdominio al puerto del backend (por defecto `3001`).

```nginx
# Ejemplo de configuración Nginx en Hostinger
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**7. Actualizar en producción**

```bash
cd /home/usuario/virtual-tryon/backend
git pull origin main
pnpm install --production
npm run build
pm2 restart virtual-tryon-backend
```

---

## Configuración DNS y SSL

Ver sección correspondiente en el README raíz del proyecto.
