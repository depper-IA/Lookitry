import sqlite3
import json

try:
    conn = sqlite3.connect('/var/lib/docker/volumes/n8n_data/_data/database.sqlite')
    cursor = conn.cursor()

    cursor.execute('SELECT id, name, active FROM workflow_entity')
    rows = cursor.fetchall()
    print("=== TODOS LOS WORKFLOWS EN LA DB ===")
    for row in rows:
        print(f"ID: {row[0]} | Name: {row[1]} | Active: {row[2]}")
    conn.close()
except Exception as e:
    print(f"Error: {str(e)}")
