# Motor IA y Sistema RAG - Lookitry

## Descripcion General
Lookitry utiliza un sistema de **Retrieval-Augmented Generation (RAG)** para mejorar la calidad de las generaciones de imagenes basandose en el feedback historico. Este sistema permite que la IA "aprenda" de errores pasados sin necesidad de re-entrenar modelos.

## Componentes Tecnicos

### 1. Vector Database (Supabase + pgvector)
- **Extrension**: `vector` habilitada en Postgres.
- **Tabla**: `generation_feedback`
- **Dimension**: 768 (asociado a gemini-embedding-001).
- **Funcion de Busqueda**: `search_similar_feedback` utilizando distancia cosmetica para encontrar errores visuales parecidos.

### 2. Flujo de Enriquecimiento (PromptRAG)
Ubicacion: `backend/src/services/prompt-rag.service.ts`

1. **Captura**: Cuando un usuario reporta un error (feedback), se genera un embedding de la descripcion del error y se guarda.
2. **Recuperacion**: Ante una nueva solicitud de generacion, el sistema busca en la base de datos de vectores feedbacks similares para la misma categoria de producto.
3. **Razonamiento**: Si encuentra errores relevantes, envia el prompt original + las reglas aprendidas (ej: "En camisas rojas, no distorsionar el cuello") a **Gemini 2.0 Flash**.
4. **Optimizacion**: Gemini reescribe el prompt en ingles, fortaleciendo las instrucciones negativas para evitar el error repetido.

## Modelos Utilizados (Stack Gratuito)
- **Embeddings**: `gemini-embedding-001`
- **Razonamiento**: `gemini-2.0-flash`
- **Timeout**: El proceso RAG tiene un timeout estricto de **4000ms** para no retrasar la experiencia del usuario.

## Reglas de Negocio
- Solo se aplica RAG si existe un `GEMINI_API_KEY`.
- Si el proceso RAG falla o excede el tiempo, el sistema hace fallback al prompt base automaticamente.
- Las reglas aprendidas se inyectan como un bloque de instruccion prioritario en el prompt enviado al motor de generacion (n8n/Replicate).
