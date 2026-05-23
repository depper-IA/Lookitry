#!/usr/bin/env python3
"""
n8n CPU Monitor - Prevents runaway CPU usage
Install as cron: * * * * * python3 /opt/n8n_monitor.py
"""

import subprocess
import time
import os
from datetime import datetime

LOG_FILE = "/var/log/n8n-monitor.log"
CONTAINER = "root-n8n-1"
CPU_THRESHOLD = 50  # % above this is concerning
SUSTAINED_MINUTES = 5  # restart after 5 minutes of high CPU
CHECK_INTERVAL = 60  # seconds between checks

count_file = "/tmp/n8n_high_cpu_count"

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def get_cpu():
    result = subprocess.run(
        ["docker", "stats", CONTAINER, "--no-stream", "--format", "{{.CPUPerc}}"],
        capture_output=True, text=True, timeout=10
    )
    cpu_str = result.stdout.strip().replace("%", "")
    return float(cpu_str)

def restart_n8n():
    log("CRITICAL: n8n sustained high CPU - restarting...")
    subprocess.run(["docker", "restart", CONTAINER], check=True)
    log("n8n restarted successfully")
    # Reset counter
    with open(count_file, "w") as f:
        f.write("0")

def main():
    cpu = get_cpu()
    log(f"n8n CPU: {cpu}%")

    if cpu > CPU_THRESHOLD:
        # Increment counter
        try:
            with open(count_file, "r") as f:
                count = int(f.read().strip())
        except:
            count = 0

        count += 1
        with open(count_file, "w") as f:
            f.write(str(count))

        log(f"High CPU detected ({count}/{SUSTAINED_MINUTES} minutes)")

        if count >= SUSTAINED_MINUTES:
            restart_n8n()
    else:
        # Reset counter if CPU is normal
        with open(count_file, "w") as f:
            f.write("0")

if __name__ == "__main__":
    main()