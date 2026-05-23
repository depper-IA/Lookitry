import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)

cmd = """
VOL_PATH=$(docker volume inspect n8n_data --format '{{.Mountpoint}}')
sqlite3 $VOL_PATH/database.sqlite "SELECT data FROM execution_entity ORDER BY id DESC LIMIT 1;"
"""
stdin, stdout, stderr = client.exec_command(cmd)
exe_json = stdout.read().decode('utf-8')

try:
    exe = json.loads(exe_json)
    # The first node execution in the data will be the webhook
    # Let's find the webhook output
    start_data = exe.get("resultData", {}).get("runData", {}).get("Webhook", [])
    if start_data:
        print("WEBHOOK RECEIVED OUTPUT:")
        print(json.dumps(start_data[0].get("data", {}).get("main", [[[]]])[0][0], indent=2))
except Exception as e:
    print("Error:", e)
    print("Raw output:", exe_json[:1000])

client.close()
