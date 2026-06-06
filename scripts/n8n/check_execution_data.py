import sqlite3
import json

def unpack_json(obj):
    if isinstance(obj, str):
        try:
            unpacked = json.loads(obj)
            return unpack_json(unpacked)
        except Exception:
            return obj
    elif isinstance(obj, dict):
        return {k: unpack_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [unpack_json(x) for x in obj]
    return obj

try:
    conn = sqlite3.connect('/var/lib/docker/volumes/n8n_data/_data/database.sqlite')
    cursor = conn.cursor()

    cursor.execute("SELECT data FROM execution_data WHERE executionId = '15443'")
    row = cursor.fetchone()
    if row and row[0]:
        data = json.loads(row[0])
        print("Unpacking JSON data...")
        unpacked_data = unpack_json(data)
        
        # Ahora buscar 'runData' recursivamente en los datos desempaquetados
        def find_key(obj, target):
            if isinstance(obj, dict):
                if target in obj:
                    return obj[target]
                for v in obj.values():
                    res = find_key(v, target)
                    if res is not None:
                        return res
            elif isinstance(obj, list):
                for x in obj:
                    res = find_key(x, target)
                    if res is not None:
                        return res
            return None

        run_data = find_key(unpacked_data, 'runData')
        if run_data:
            print("runData nodes found:", list(run_data.keys()))
            if 'Preparar Body Vertex' in run_data:
                print("\n=== RUN DATA 'Preparar Body Vertex' ===")
                print(json.dumps(run_data['Preparar Body Vertex'], indent=2)[:3000])
        else:
            print("No se encontró 'runData' después de desempaquetar")

    conn.close()
except Exception as e:
    print(f"Error: {str(e)}")
