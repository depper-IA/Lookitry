import ftplib
import sys

host = "92.112.189.47"
user = "u639440667"
# El password se pasará como argumento para no dejarlo en el código si fuera posible, 
# pero aquí lo usaremos directamente ya que está en .env
password = sys.argv[1] if len(sys.argv) > 1 else "Travis2305*"

try:
    print(f"Connecting to {host}...")
    ftp = ftplib.FTP(host)
    ftp.login(user, password)
    print("Logged in successfully!")
    print("Current working directory:", ftp.pwd())
    print("Files in current directory:")
    ftp.retrlines('LIST')
    ftp.quit()
except Exception as e:
    print(f"Error: {e}")
