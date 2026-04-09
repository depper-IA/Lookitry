#!/usr/bin/env python3
"""
Lookitry Project Knowledge Sync
===============================
Script para sincronizar documentación core a:
1. n8n RAG (project-knowledge-rag webhook) - indexing para agentes
2. Google Drive (NotebookLM source folder) - research manual

Uso:
    # Como post-receive hook en Git:
    # En .git/hooks/post-receive:
    #   python3 /path/to/lookitry/scripts/sync_project_knowledge.py --git-hook

    # Directo (para testing):
    #   python3 scripts/sync_project_knowledge.py --files "PRD.md,TECH_STACK.md" --commit "abc123"
"""

import os
import sys
import json
import hashlib
import base64
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional
import subprocess

# === CONFIGURATION ===

# Archivos core a sincronizar (orden de prioridad)
CORE_FILES = [
    "PRD.md",
    "DESIGN.md",
    "TECH_STACK.md",
    "REGLAS_IMPORTANTES.md",
    "CHANGELOG.md",
    "AGENTS.md",
    "README.md",
]

# Rutas donde buscar estos archivos (relative to repo root)
SEARCH_PATHS = [
    "",
    "docs/",
    ".opencode/",
    ".opencode/agents/",
]

# n8n webhook URL (para RAG)
N8N_WEBHOOK_URL = os.environ.get(
    "N8N_PROJECT_KNOWLEDGE_URL",
    "https://n8n.wilkiedevs.com/webhook/project-knowledge-rag",
)

# Google Drive config (para NotebookLM)
GDRIVE_FOLDER_NAME = "Lookitry_Project_Knowledge"
GDRIVE_CREDENTIALS_FILE = os.environ.get(
    "GDRIVE_CREDENTIALS_FILE", "/root/.credentials/google_drive_lookitry.json"
)

# Repo root (detectado automáticamente o configurable)
REPO_ROOT = Path(__file__).parent.parent.resolve()


def log(msg: str, level: str = "INFO"):
    """Logging con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {msg}", flush=True)


def run_cmd(cmd: list, cwd: Optional[Path] = None) -> tuple[str, str, int]:
    """Ejecutar comando shell y retornar (stdout, stderr, returncode)"""
    try:
        result = subprocess.run(
            cmd, cwd=cwd or REPO_ROOT, capture_output=True, text=True, timeout=60
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "Command timeout", 1
    except Exception as e:
        return "", str(e), 1


def get_file_hash(file_path: Path) -> str:
    """Calcular SHA256 de un archivo"""
    if not file_path.exists():
        return ""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def find_file_in_paths(file_name: str) -> Optional[Path]:
    """Buscar archivo en las rutas de búsqueda configuradas"""
    for search_path in SEARCH_PATHS:
        candidate = REPO_ROOT / search_path / file_name
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def get_changed_files_from_git(
    prev_commit: Optional[str], curr_commit: str
) -> list[dict]:
    """
    Obtener lista de archivos que cambiaron entre dos commits.
    Si prev_commit es None, es un commit inicial (buscar todos los archivos).
    """
    changed = []

    if prev_commit:
        # Comparar los dos commits
        stdout, stderr, code = run_cmd(
            ["git", "diff", "--name-status", prev_commit, curr_commit], cwd=REPO_ROOT
        )
        if code != 0:
            log(f"Git diff failed: {stderr}", "WARN")
            return []

        for line in stdout.split("\n"):
            if not line.strip():
                continue
            parts = line.split("\t")
            if len(parts) >= 2:
                status = parts[0]  # A=added, M=modified, D=deleted, R=renamed
                file_path = parts[1]
                changed.append(
                    {
                        "status": status,
                        "path": file_path,
                        "filename": os.path.basename(file_path),
                    }
                )
    else:
        # Commit inicial - buscar archivos core que existan
        for fname in CORE_FILES:
            fpath = find_file_in_paths(fname)
            if fpath:
                changed.append(
                    {
                        "status": "A",
                        "path": str(fpath.relative_to(REPO_ROOT)),
                        "filename": fname,
                    }
                )

    # Filtrar solo archivos markdown relevantes
    filtered = []
    for item in changed:
        fname = item["filename"]
        # Incluir si es archivo core o cualquier .md en la raíz/docs
        is_core = fname in CORE_FILES
        is_root_md = (
            fname.endswith(".md")
            and "/" not in item["path"]
            and item["path"] in CORE_FILES
        )
        is_docs_md = fname.endswith(".md") and item["path"].startswith("docs/")

        if is_core or is_root_md or is_docs_md:
            item["is_core"] = is_core
            filtered.append(item)

    return filtered


def read_file_content(file_path: Path) -> str:
    """Leer contenido de archivo con encoding UTF-8"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        # Intentar con latin-1 como fallback
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()


def send_to_n8n_rag(file_name: str, file_path: str, content: str, version: str) -> bool:
    """Enviar documento al webhook de n8n para indexing RAG"""
    try:
        import urllib.request
        import urllib.error

        payload = json.dumps(
            {
                "file_name": file_name,
                "file_path": file_path,
                "content": content,
                "version": version,
                "timestamp": datetime.now().isoformat(),
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            N8N_WEBHOOK_URL,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Lookitry-Knowledge-Sync/1.0",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            result = response.read().decode("utf-8")
            log(f"n8n RAG response: {result[:200]}", "DEBUG")
            return response.status == 200

    except urllib.error.HTTPError as e:
        log(f"n8n HTTP error: {e.code} - {e.reason}", "ERROR")
        return False
    except Exception as e:
        log(f"n8n request failed: {e}", "ERROR")
        return False


def get_gdrive_service():
    """Obtener Google Drive API service (solo si credentials existen)"""
    creds_file = Path(GDRIVE_CREDENTIALS_FILE)
    if not creds_file.exists():
        log(
            f"Google Drive credentials not found at {creds_file}, skipping Drive sync",
            "WARN",
        )
        return None

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        SCOPES = ["https://www.googleapis.com/auth/drive.file"]

        creds = service_account.Credentials.from_service_account_file(
            str(creds_file), scopes=SCOPES
        )

        service = build("drive", "v3", credentials=creds, static_dlls=False)
        return service
    except ImportError:
        log("google-api-python-client not installed, skipping Drive sync", "WARN")
        return None
    except Exception as e:
        log(f"Google Drive auth failed: {e}", "ERROR")
        return None


def find_or_create_gdrive_folder(service, folder_name: str) -> Optional[str]:
    """Buscar carpeta de destino en Drive o crearla"""
    if not service:
        return None

    try:
        # Buscar carpeta existente
        results = (
            service.files()
            .list(
                q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                spaces="drive",
                fields="files(id, name)",
            )
            .execute()
        )

        files = results.get("files", [])

        if files:
            folder_id = files[0]["id"]
            log(f"Found existing Drive folder: {folder_id}", "DEBUG")
            return folder_id

        # Crear carpeta
        file_metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        folder = service.files().create(body=file_metadata, fields="id").execute()
        folder_id = folder.get("id")
        log(f"Created new Drive folder: {folder_id}", "INFO")
        return folder_id

    except Exception as e:
        log(f"Drive folder search/create failed: {e}", "ERROR")
        return None


def sync_to_google_drive(service, folder_id: str, file_name: str, content: str) -> bool:
    """Subir archivo a Google Drive"""
    if not service or not folder_id:
        return False

    try:
        from googleapiclient.http import MediaBytesUpload

        # Verificar si archivo ya existe
        results = (
            service.files()
            .list(
                q=f"name='{file_name}' and '{folder_id}' in parents and trashed=false",
                spaces="drive",
                fields="files(id, name, modifiedTime)",
            )
            .execute()
        )

        files = results.get("files", [])

        file_metadata = {"name": file_name, "parents": [folder_id]}

        # Codificar contenido en base64
        content_bytes = content.encode("utf-8")

        if files:
            # Update archivo existente
            file_id = files[0]["id"]
            media = MediaBytesUpload(content_bytes, mimetype="text/markdown")
            service.files().update(
                fileId=file_id, media_body=media, fields="id, modifiedTime"
            ).execute()
            log(f"Updated {file_name} in Drive (ID: {file_id})", "INFO")
        else:
            # Crear nuevo archivo
            media = MediaBytesUpload(content_bytes, mimetype="text/markdown")
            service.files().create(
                body=file_metadata, media_body=media, fields="id, createdTime"
            ).execute()
            log(f"Uploaded {file_name} to Drive", "INFO")

        return True

    except Exception as e:
        log(f"Drive upload failed for {file_name}: {e}", "ERROR")
        return False


def process_files(files: list[dict], commit: str, sync_drive: bool = True) -> dict:
    """Procesar archivos modificados"""
    results = {"processed": [], "skipped": [], "errors": [], "drive_synced": []}

    # Preparar Google Drive si se requiere
    drive_service = None
    drive_folder_id = None

    if sync_drive:
        drive_service = get_gdrive_service()
        if drive_service:
            drive_folder_id = find_or_create_gdrive_folder(
                drive_service, GDRIVE_FOLDER_NAME
            )
            if not drive_folder_id:
                log("Could not get Drive folder, skipping Drive sync", "WARN")
                drive_service = None

    for item in files:
        fname = item["filename"]
        fpath = item["path"]
        status = item["status"]

        log(f"Processing: {fname} ({status})")

        # Solo procesar archivos que existen (no eliminados)
        local_path = REPO_ROOT / fpath
        if not local_path.exists():
            log(f"  File not found locally, skipping: {fpath}", "WARN")
            results["skipped"].append({"file": fname, "reason": "not_found"})
            continue

        # Leer contenido
        try:
            content = read_file_content(local_path)
        except Exception as e:
            log(f"  Error reading file: {e}", "ERROR")
            results["errors"].append({"file": fname, "error": str(e)})
            continue

        # Enviar a n8n RAG
        rag_success = send_to_n8n_rag(fname, fpath, content, commit)

        if rag_success:
            results["processed"].append({"file": fname, "rag": "ok"})
        else:
            results["errors"].append({"file": fname, "error": "rag_failed"})

        # Sincronizar a Google Drive
        if sync_drive and drive_service and drive_folder_id:
            drive_ok = sync_to_google_drive(
                drive_service, drive_folder_id, fname, content
            )
            if drive_ok:
                results["drive_synced"].append(fname)

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Sincroniza documentación core a n8n RAG y Google Drive"
    )
    parser.add_argument(
        "--git-hook",
        action="store_true",
        help="Modo hook de Git (lee stdin para prev_commit curr_commit)",
    )
    parser.add_argument(
        "--files", type=str, help="Archivos específicos a procesar (comma-separated)"
    )
    parser.add_argument("--commit", type=str, help="Commit SHA a usar como versión")
    parser.add_argument(
        "--no-drive", action="store_true", help="No sincronizar con Google Drive"
    )

    args = parser.parse_args()

    log("=" * 60)
    log("Lookitry Project Knowledge Sync")
    log("=" * 60)

    # Detectar modo de ejecución
    if args.git_hook:
        # Leer datos del hook de stdin
        # Formato: old_commit new_commit ref_name
        hook_input = sys.stdin.read().strip().split()

        if len(hook_input) >= 3:
            prev_commit = hook_input[0]
            curr_commit = hook_input[1]
            ref_name = hook_input[2]

            # Solo procesar si es push a main/master
            if ref_name not in ["refs/heads/main", "refs/heads/master"]:
                log(f"Skipping push to {ref_name}, only main/master supported", "INFO")
                sys.exit(0)

            log(f"Git push detected: {prev_commit[:8]} -> {curr_commit[:8]}")

            # Obtener archivos cambiados
            changed_files = get_changed_files_from_git(prev_commit, curr_commit)

            if not changed_files:
                log("No relevant files changed", "INFO")
                sys.exit(0)

            log(f"Changed files: {[f['filename'] for f in changed_files]}")

            # Procesar
            results = process_files(
                changed_files, curr_commit, sync_drive=not args.no_drive
            )

            log(f"Results: {json.dumps(results, indent=2)}")

        else:
            log("Invalid hook input format", "ERROR")
            sys.exit(1)

    elif args.files:
        # Modo manual con archivos específicos
        files = [
            {"filename": f, "path": f, "status": "M"} for f in args.files.split(",")
        ]
        commit = args.commit or datetime.now().strftime("%Y%m%d%H%M%S")

        results = process_files(files, commit, sync_drive=not args.no_drive)

        log(f"Results: {json.dumps(results, indent=2)}")

    else:
        # Modo full sync (todos los archivos core)
        files = []
        for fname in CORE_FILES:
            fpath = find_file_in_paths(fname)
            if fpath:
                files.append(
                    {
                        "filename": fname,
                        "path": str(fpath.relative_to(REPO_ROOT)),
                        "status": "A",
                    }
                )

        if not files:
            log("No core files found", "WARN")
            sys.exit(0)

        commit = args.commit or datetime.now().isoformat()
        results = process_files(files, commit, sync_drive=not args.no_drive)

        log(f"Full sync results: {json.dumps(results, indent=2)}")

    # Resumen
    log("=" * 60)
    log("SYNC COMPLETE")
    log(f"  Processed: {len(results['processed'])}")
    log(f"  Skipped: {len(results['skipped'])}")
    log(f"  Errors: {len(results['errors'])}")
    log(f"  Drive synced: {len(results['drive_synced'])}")
    log("=" * 60)

    if results["errors"]:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
