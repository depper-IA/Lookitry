import sqlite3
import json

db_path = '/var/lib/docker/volumes/n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Desactivar el workflow en la base de datos
    print("Desactivando el workflow para limpiar el caché de producción...")
    cursor.execute("UPDATE workflow_entity SET active = 0 WHERE id = 'wPLypk7KhBcFLicX'")
    conn.commit()

    # 2. Reactivar el workflow para obligar a n8n a compilar y registrar el webhook con el nuevo código
    print("Reactivando el workflow para compilar el parche definitivo en producción...")
    cursor.execute("UPDATE workflow_entity SET active = 1 WHERE id = 'wPLypk7KhBcFLicX'")
    conn.commit()

    print("Workflow 'Virtual Try-On - Flujo Completo' reactivado exitosamente!")
    conn.close()
except Exception as e:
    print(f"Error: {str(e)}")
