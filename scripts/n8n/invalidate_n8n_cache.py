import sqlite3
import uuid
from datetime import datetime

db_path = '/var/lib/docker/volumes/n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Generar un nuevo UUID para versionId y activeVersionId para invalidar cualquier caché
    new_version_id = str(uuid.uuid4())
    now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%f')[:-3] # Formato 'YYYY-MM-DD HH:MM:SS.fff'

    print("Caché invalidation - Nuevos valores:")
    print(f"New Version ID: {new_version_id}")
    print(f"Timestamp: {now_str}")

    # Forzar actualización de metadatos en workflow_entity para que n8n sepa que el flujo cambió y lo recompile
    cursor.execute("""
        UPDATE workflow_entity 
        SET versionId = ?, activeVersionId = ?, updatedAt = ?, versionCounter = versionCounter + 1 
        WHERE id = 'wPLypk7KhBcFLicX'
    """, (new_version_id, new_version_id, now_str))
    
    conn.commit()
    print("Metadatos de workflow_entity actualizados con éxito en la base de datos!")
    conn.close()
except Exception as e:
    print(f"Error: {str(e)}")
