import os
from anthropic import AnthropicVertex

# Configura las credenciales (ya que estamos en GCP, usa la variable de entorno o auth por defecto)
# Opcional: asegurarnos de que GOOGLE_APPLICATION_CREDENTIALS esté seteado
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/Matt/Lookitry/mcp-gcp/service-account.json"

client = AnthropicVertex(region="global", project_id="gen-lang-client-0591001769")
message = client.messages.create(
 max_tokens=1024,
 messages=[{"role": "user", "content": "Hello! Are you Claude Sonnet 4.6? Please reply briefly in Spanish."}],
 model="claude-sonnet-4-6"
)
print(message.content[0].text)
