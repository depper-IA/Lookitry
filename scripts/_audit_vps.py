import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#')

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode()

print("=== DISCO ===")
print(run("df -h /"))

print("=== USO POR DIRECTORIO DOCKER ===")
print(run("du -sh /var/lib/docker/overlay2 /var/lib/docker/containers /var/lib/docker/volumes /var/lib/docker/buildkit 2>/dev/null"))

print("=== IMAGENES DOCKER ===")
print(run('docker images --format "{{.Repository}}:{{.Tag}}  {{.Size}}  {{.ID}}"'))

print("=== CONTENEDORES (todos) ===")
print(run('docker ps -a --format "{{.Names}}  {{.Status}}"'))

print("=== VOLUMENES ===")
print(run("docker volume ls"))

print("=== BUILDKIT CACHE ===")
print(run("docker buildx du 2>/dev/null || echo 'buildx no disponible'"))

print("=== LOGS PESADOS ===")
print(run("find /var/lib/docker/containers -name '*.log' -exec du -sh {} + 2>/dev/null | sort -rh | head -10"))

print("=== /root PESADO ===")
print(run("du -sh /root/* 2>/dev/null | sort -rh | head -15"))

print("=== /tmp ===")
print(run("du -sh /tmp 2>/dev/null"))

ssh.close()
print("=== FIN AUDITORIA ===")
