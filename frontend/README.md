# Virtual Try-On SaaS — Frontend

Aplicación Next.js 14 con TypeScript y TailwindCSS. Incluye el dashboard de marca, el probador público y el panel de administrador.

## Requisitos

- Node.js >= 18
- npm >= 9
- Backend corriendo (ver `backend/README.md`)

## Instalación local

```bash
cd frontend
npm install
cp .env.example .env
# Editar .env con la URL del backend
npm run dev
```

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Iniciar servidor Next.js compilado |
| `npm run lint` | Verificar código con ESLint |

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores. La variable más importante en producción es `NEXT_PUBLIC_API_URL`, que debe apuntar al backend desplegado.

---

## Deploy en Hostinger — Frontend (Next.js)

### Requisitos previos en Hostinger

- Plan de hosting con soporte Node.js (VPS o Business Hosting)
- Acceso SSH al servidor
- PM2 instalado globalmente: `npm install -g pm2`
- Backend ya desplegado y accesible por HTTPS

### Pasos de deploy

**1. Subir el código al servidor**

```bash
# Opción A: clonar desde Git
git clone https://github.com/tu-usuario/tu-repo.git /home/usuario/virtual-tryon
cd /home/usuario/virtual-tryon/frontend

# Opción B: subir por SFTP
# Subir la carpeta frontend/ excluyendo node_modules/ y .next/
```

**2. Configurar variables de entorno**

```bash
cp .env.example .env
nano .env
# Valores clave para producción:
# NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
# NEXT_PUBLIC_APP_URL=https://tu-dominio.com
# NEXT_PUBLIC_SUPABASE_URL=<tu url de supabase>
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu anon key>
```

**3. Instalar dependencias y compilar**

```bash
npm install
npm run build
# Genera la carpeta .next/ con el build optimizado
```

**4. Iniciar con PM2**

```bash
pm2 start npm --name virtual-tryon-frontend -- start
pm2 save
pm2 startup

# Verificar estado
pm2 status
pm2 logs virtual-tryon-frontend
```

Por defecto Next.js escucha en el puerto `3000`. Para usar otro puerto:

```bash
pm2 start npm --name virtual-tryon-frontend -- start -- -p 3000
```

**5. Configurar proxy inverso en Hostinger (Nginx)**

En el panel de Hostinger, apuntar el dominio principal al puerto del frontend:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**6. Actualizar en producción**

```bash
cd /home/usuario/virtual-tryon/frontend
git pull origin main
npm install
npm run build
pm2 restart virtual-tryon-frontend
```

---

## Configuración DNS y SSL

Ver sección correspondiente en el README raíz del proyecto.
