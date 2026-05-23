#!/bin/bash
# Monitor n8n CPU and restart if sustained high load

CONTAINER="root-n8n-1"
CPU_THRESHOLD=80
SUSTAINED_SECONDS=300
LOG_FILE="/var/log/n8n-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

get_cpu() {
    docker stats "$CONTAINER" --no-stream --format "{{.CPUPerc}}" | sed 's/%//'
}

check_n8n() {
    local cpu=$(get_cpu)
    log "n8n CPU: ${cpu}%"

    if (( $(echo "$cpu > $CPU_THRESHOLD" | bc -l) )); then
        log "WARNING: n8n CPU above ${CPU_THRESHOLD}%"

        # Count high CPU occurrences
        count_file="/tmp/n8n_high_cpu_count"
        echo $((${count_file:-0} + 1)) > "$count_file"

        local count=$(cat "$count_file")
        if [ "$count" -ge 3 ]; then
            log "CRITICAL: n8n sustained high CPU for ${SUSTAINED_SECONDS}s+ - restarting container"
            docker restart "$CONTAINER"
            echo "0" > "$count_file"
            log "n8n restarted at $(date)"
        fi
    else
        echo "0" > "/tmp/n8n_high_cpu_count"
    fi
}

# Run check
check_n8n