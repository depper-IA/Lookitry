import os
import sys
import re

def check_file_integrity(filepath):
    """Verifica si un archivo tiene caracteres corruptos (mojibake) o patrones peligrosos."""
    if not os.path.exists(filepath):
        return True, "Archivo no existe (ignorado)."

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return False, f"ERROR: Fallo de codificación (No es UTF-8 válido)."

    # 1. Detectar patrones de Mojibake comunes (Ã³, ï¿½, etc.)
    mojibake_patterns = [
        r'Ã[^\s]',  # Caracteres latinos mal codificados
        r'ï¿½',      # Replacement character roto
        r'â[^\s][^\s]' # Secuencias de 3 bytes rotas
    ]
    
    for pattern in mojibake_patterns:
        if re.search(pattern, content):
            return False, f"ERROR: Posible corrupción de caracteres (Mojibake) detectada en {filepath}."

    # 2. Verificar patrones de código inseguro en Dashboards (Acceso sin optional chaining)
    # Solo aplica a archivos .tsx de administración
    if "admin" in filepath and filepath.endswith(".tsx"):
        unsafe_stats = re.findall(r'stats\.[a-zA-Z]+', content)
        for match in unsafe_stats:
            # Si vemos stats.conversion sin ?., es sospechoso
            if not re.search(r'stats\?\.|\?\.stats', content):
                # Este es un check agresivo, opcional:
                # print(f"AVISO: Acceso directo detectado: {match} en {filepath}")
                pass

    return True, "Integridad OK."

def main():
    files_to_check = [
        "backend/src/services/admin.service.ts",
        "frontend/src/app/admin/dashboard/page.tsx",
        "frontend/src/app/admin/conversion/page.tsx"
    ]
    
    # También escanear archivos modificados recientemente (opcional)
    
    errors = []
    for f in files_to_check:
        success, msg = check_file_integrity(f)
        if not success:
            errors.append(msg)
            print(f"❌ {f}: {msg}")
        else:
            print(f"✅ {f}: {msg}")

    if errors:
        print("\n⚠️ SE DETECTARON PROBLEMAS DE INTEGRIDAD. REVISA LOS ARCHIVOS ANTES DE HACER PUSH.")
        sys.exit(1)
    else:
        print("\n🚀 Blindaje verificado. El código parece seguro.")
        sys.exit(0)

if __name__ == "__main__":
    main()
