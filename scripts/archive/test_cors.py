import paramiko

def test_cors():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

    print("=== TEST WITH ALLOWED ORIGIN: https://lookitry.com ===")
    stdin, stdout, stderr = ssh.exec_command('curl -I -s -H "Origin: https://lookitry.com" https://api.lookitry.com/health')
    print(stdout.read().decode())

    print("=== TEST WITH DISALLOWED ORIGIN: https://malicious.com ===")
    stdin, stdout, stderr = ssh.exec_command('curl -I -s -H "Origin: https://malicious.com" https://api.lookitry.com/health')
    print(stdout.read().decode())

    ssh.close()

if __name__ == '__main__':
    test_cors()
