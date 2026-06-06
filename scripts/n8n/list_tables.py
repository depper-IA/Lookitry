import sqlite3

try:
    conn = sqlite3.connect('/var/lib/docker/volumes/n8n_data/_data/database.sqlite')
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Tables in SQLite: {tables}")

    conn.close()
except Exception as e:
    print(f"Error: {str(e)}")
