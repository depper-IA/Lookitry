import paramiko

def check_log_shipper():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

    print("=== DOCKER PS -A ===")
    stdin, stdout, stderr = ssh.exec_command('docker ps -a')
    print(stdout.read().decode())

    print("=== SYSTEMCTL SERVICES ===")
    stdin, stdout, stderr = ssh.exec_command('systemctl list-units --type=service')
    services = stdout.read().decode()
    for line in services.splitlines():
        if any(term in line.lower() for term in ['vector', 'fluent', 'filebeat', 'log', 'ship', 'datadog', 'dynatrace']):
            print(line)

    print("=== SEARCHING FOR LOG CONFIGS ===")
    stdin, stdout, stderr = ssh.exec_command('find /etc -name "*vector*" -o -name "*fluent*" -o -name "*filebeat*" 2>/dev/null')
    print(stdout.read().decode())

    ssh.close()

if __name__ == '__main__':
    check_log_shipper()
