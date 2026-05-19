"""
Fast frontend deploy: build locally → rsync to VPS → inject into container → restart.
Skip: ~160s Docker build on VPS. Deploy time: ~60-90s (local build) + ~15s (inject/restart).

Usage:
  python3 scripts/fast_deploy_frontend_local.py
"""
import os
import subprocess
import sys
import paramiko
import tarfile
import tempfile
import time

VPS_HOST = "31.220.18.39"
VPS_USER = "root"
VPS_PASS = "Travis18456916#"
CONTAINER_NAME = "lookitry-frontend"
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

PROD_ENV = {
    "NEXT_PUBLIC_API_URL": "https://api.lookitry.com",
    "NEXT_PUBLIC_APP_URL": "https://lookitry.com",
    "NEXT_PUBLIC_SUPABASE_URL": "https://vkdooutklowctuudjnkl.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "***REMOVED-SECRET***",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": "G-F8277E4Z39",
    "NEXT_PUBLIC_GTM_ID": "GTM-KX6L62K3",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID": "568746448761-gp9b68r5sf8jdv9t1jsrtightfqjq0j0.apps.googleusercontent.com",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY": "0x4AAAAAACsmy7e_yL9iyAXM",
    "NEXT_PUBLIC_REBECCA_WIDGET_ENABLED": "true",
    "NEXT_PUBLIC_WOMPI_PUBLIC_KEY": "REEMPLAZAR_CON_LLAVE_PUBLICA_WOMPI",
    "NEXT_PUBLIC_WOMPI_ENABLED": "false",
    "SUPABASE_SERVICE_KEY": "***REMOVED-SECRET***",
    "NODE_ENV": "production",
}


def run(cmd, cwd=None, env=None, label=""):
    print(f"\n▶ {label or cmd[:60]}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, env=env, capture_output=False)
    if result.returncode != 0:
        print(f"✗ Failed (exit {result.returncode})")
        sys.exit(1)
    print(f"✓ Done")


def step1_build():
    print("\n═══ STEP 1: Build locally with prod env vars ═══")
    env = {**os.environ, **PROD_ENV}
    # Clean previous build
    run("rm -rf .next", cwd=FRONTEND_DIR, env=env, label="Clean .next")
    run("pnpm build", cwd=FRONTEND_DIR, env=env, label="pnpm build (prod env)")


def step2_upload(ssh: paramiko.SSHClient, sftp: paramiko.SFTPClient):
    print("\n═══ STEP 2: Upload build artifacts to VPS ═══")
    frontend_dir = os.path.abspath(FRONTEND_DIR)

    # Create tarball of standalone + static + public
    tar_path = "/tmp/frontend-deploy.tar.gz"
    print(f"  Creating archive...")
    with tarfile.open(tar_path, "w:gz") as tar:
        standalone = os.path.join(frontend_dir, ".next", "standalone")
        tar.add(standalone, arcname="standalone")
        static = os.path.join(frontend_dir, ".next", "static")
        tar.add(static, arcname="static")
        public = os.path.join(frontend_dir, "public")
        tar.add(public, arcname="public")

    size_mb = os.path.getsize(tar_path) / 1024 / 1024
    print(f"  Archive size: {size_mb:.1f} MB")

    print(f"  Uploading to VPS...")
    sftp.put(tar_path, "/tmp/frontend-deploy.tar.gz")
    print(f"  ✓ Uploaded")


def step3_inject(ssh: paramiko.SSHClient):
    print("\n═══ STEP 3: Inject into container + restart ═══")

    commands = [
        # Extract on VPS
        "rm -rf /tmp/frontend-build && mkdir -p /tmp/frontend-build",
        "tar -xzf /tmp/frontend-deploy.tar.gz -C /tmp/frontend-build",
        # Inject standalone (server.js + node_modules)
        f"docker cp /tmp/frontend-build/standalone/. {CONTAINER_NAME}:/app/",
        # Inject static assets
        f"docker cp /tmp/frontend-build/static {CONTAINER_NAME}:/app/.next/",
        # Inject public files
        f"docker cp /tmp/frontend-build/public {CONTAINER_NAME}:/app/",
        # Restart (not recreate)
        f"docker restart {CONTAINER_NAME}",
        # Cleanup
        "rm -rf /tmp/frontend-build /tmp/frontend-deploy.tar.gz",
    ]

    for cmd in commands:
        label = cmd[:70]
        print(f"  ▶ {label}")
        _, stdout, stderr = ssh.exec_command(cmd)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out:
            print(f"    {out}")
        if exit_code != 0:
            print(f"  ✗ Error: {err}")
            sys.exit(1)
        print(f"  ✓")


def main():
    t0 = time.time()
    print("🚀 Fast frontend deploy: local build → VPS inject")

    step1_build()

    print("\n═══ Connecting to VPS ═══")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS)
    sftp = ssh.open_sftp()

    step2_upload(ssh, sftp)
    step3_inject(ssh)

    sftp.close()
    ssh.close()

    elapsed = time.time() - t0
    print(f"\n✅ Deploy done in {elapsed:.0f}s")


if __name__ == "__main__":
    main()
