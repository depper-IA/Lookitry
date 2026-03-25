---
name: git-deploy
description: Flujo correcto de git, commit, push y deploy para Lookitry. Evita todos los errores conocidos de ejecución.
---

# GIT, COMMIT, PUSH & DEPLOY — Lookitry

## Reglas de oro antes de cualquier acción

1. El workspace raíz es `C:\Users\Usuario\Mostrador_wilkiedevs` — SIEMPRE usar `cwd` en los comandos, NUNCA `cd`.
2. El separador de comandos en PowerShell es `;` — NUNCA usar `&&`.
3. El repo se renombró de `virtual-tryon` a `Lookitry`. GitHub redirige automáticamente, pero el remote local sigue apuntando al nombre viejo — esto es normal y no causa errores.
4. NUNCA hacer deploy sin que el usuario lo pida explícitamente.
5. Todos los cambios van a la rama `main` (salvo que el usuario indique `Juli`).

---

## Flujo estándar completo

```powershell
# 1. Verificar estado
git status

# 2. Traer cambios remotos antes de pushear
git pull origin main --rebase

# 3. Agregar y commitear
git add -A
git commit -m "tipo(scope): descripción"

# 4. Push
git push origin main

# 5. Deploy (solo si el usuario lo pide)
python scripts/_deploy_now.py --frontend   # solo frontend
python scripts/_deploy_now.py --backend    # solo backend
python scripts/_deploy_now.py              # ambos
python scripts/_deploy_now.py --restart    # solo reinicia (~5s, sin rebuild)
```

---

## Errores conocidos y sus soluciones

### Error: `ModuleNotFoundError: No module named 'dotenv'`
**Causa:** `python-dotenv` o `paramiko` no instalados en la máquina local.  
**Solución:** El script `_deploy_now.py` ya los auto-instala. Si falla igual:
```powershell
pip install paramiko python-dotenv -q
```

### Error: `Starting directory (cwd) does not exist` — ruta duplicada
**Causa:** Se usó `cwd: Mostrador_wilkiedevs/Mostrador_wilkiedevs` (duplicado).  
**Solución:** Usar siempre `cwd: C:\Users\Usuario\Mostrador_wilkiedevs` o simplemente omitir `cwd` si ya se está en la raíz.

### Error: `Workflow does not have 'workflow_dispatch' trigger`
**Causa:** El workflow de GitHub Actions no tenía el trigger manual.  
**Solución:** Ya corregido en `.github/workflows/sync-plugin.yml`. Para disparar manualmente:
```powershell
$headers = @{ Authorization = "Bearer <GITHUB_TOKEN>"; "X-GitHub-Api-Version" = "2022-11-28"; "Content-Type" = "application/json" }
Invoke-RestMethod "https://api.github.com/repos/depper-IA/Lookitry/actions/workflows/sync-plugin.yml/dispatches" -Method POST -Headers $headers -Body '{"ref":"main"}'
```

### Error: `Sync Plugin to WordPress` falla con `can't connect without a private SSH key or password`
**Causa:** El secret `FTP_PASS` no existe en el repo (se pierde al renombrar repos en GitHub).  
**Solución:** Recrear el secret via API:
```powershell
# 1. Obtener public key del repo
$h = @{ Authorization = "Bearer <TOKEN>"; "X-GitHub-Api-Version" = "2022-11-28" }
$pk = Invoke-RestMethod "https://api.github.com/repos/depper-IA/Lookitry/actions/secrets/public-key" -Headers $h

# 2. Encriptar la contraseña con PyNaCl
pip install PyNaCl -q
python -c "
from base64 import b64decode, b64encode
from nacl import public
pk_bytes = b64decode('<key_del_paso_1>')
box = public.SealedBox(public.PublicKey(pk_bytes))
print(b64encode(box.encrypt('Travis2305*'.encode())).decode())
"

# 3. Crear el secret
$body = @{ encrypted_value = "<resultado_paso_2>"; key_id = "<key_id_del_paso_1>" } | ConvertTo-Json
Invoke-RestMethod "https://api.github.com/repos/depper-IA/Lookitry/actions/secrets/FTP_PASS" -Method PUT -Headers $h -Body $body
```

### Error: `curl: -s` no reconocido en PowerShell
**Causa:** En PowerShell, `curl` es alias de `Invoke-WebRequest`, no el curl real.  
**Solución:** Usar `Invoke-RestMethod` para APIs JSON, o `curl.exe` (con `.exe`) para curl real.

### Error: `git push` rechazado por divergencia
**Causa:** Hay commits remotos que no están localmente.  
**Solución:**
```powershell
git pull origin main --rebase
git push origin main
```

### Error: Deploy muestra `Already up to date` pero los cambios no aparecen en producción
**Causa:** El commit no se hizo push antes de correr el deploy, o el VPS jaló de un commit anterior.  
**Solución:** Verificar que `git push` fue exitoso ANTES de correr `_deploy_now.py`. El VPS siempre hace `git pull origin main` — si el push no llegó, el VPS no tiene los cambios.

---

## Verificar estado del GitHub Action del plugin

```powershell
$h = @{ Authorization = "Bearer <GITHUB_TOKEN>" }
$r = Invoke-RestMethod "https://api.github.com/repos/depper-IA/Lookitry/actions/runs?per_page=5" -Headers $h
$r.workflow_runs | Select-Object name, status, conclusion, created_at | Format-Table
```
- `conclusion: success` → plugin actualizado en WordPress ✅
- `conclusion: failure` → revisar secret `FTP_PASS` o logs del job

---

## Datos de infraestructura

| Recurso | Valor |
|---------|-------|
| Repo GitHub | `https://github.com/depper-IA/Lookitry.git` |
| VPS IP | `31.220.18.39` |
| WordPress SSH | `92.112.189.47:65002` usuario `u639440667` |
| Plugin destino WP | `/home/u639440667/domains/wilkiedevs.com/public_html/wp-content/plugins/lookitry-woocommerce/` |
| GitHub Token | en `backend/.env` campo `GITHUB_TOKEN` |
| Secret FTP_PASS | `Travis2305*` |
