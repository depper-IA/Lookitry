# Skill: Refactorizacion y Deteccion de Codigo Muerto

## Identidad

Esta skill define el protocolo obligatorio para refactorizar archivos que superen las 600 líneas y para detectar código muerto en el codebase de Lookitry.

## Protocolo de Ejecucion

### Paso 1: Verificar Tamanio de Archivo

Al trabajar en cualquier archivo de codigo (`.ts`, `.tsx`, `.js`, `.jsx`):

```
1. Contar lineas del archivo
2. Si > 600 lineas:
   - Marcar como "REQUIERE REFACTORIZACION"
   - Identificar componentes/funciones extractables
   - Priorizar extraccion de:
     a) Componentes UI separados (modals, cards, widgets)
     b) Funciones de utilidad (helpers, formatters, validators)
     c) Constantes o configuraciones estaticas
     d) Tipos o interfaces separadas
```

### Paso 2: Protocolo de Refactorizacion

```
1. IDENTIFICAR cohesion:
   - NO dividir codigo logicamente relacionado
   - Extraer solo cuando tenga sentido semantico

2. CREAR archivos separados:
   - components/  → componentes React
   - utils/        → funciones de utilidad
   - types/       → tipos TypeScript
   - constants/   → constantes

3. MANTENER contexto:
   - Crear archivo index.ts para exports
   - Mantener imports/exportaciones claros
   - Actualizar referencias en el archivo principal

4. VERIFICAR:
   - Build pasa sin errores
   - Tests pasan (si existen)
   - Ningun import queda roto
```

### Paso 3: Deteccion de Codigo Muerto

Al trabajar en cualquier archivo:

```
1. BUSCAR patterns de codigo muerto:
   - Funciones nunca llamadas (verificar en todo el proyecto)
   - Variables nunca utilizadas
   - Imports nunca usados
   - Props nunca consumidas en componentes
   - Cases en switch nunca ejecutados
   - Codigo comentado antiguo

2. VERIFICAR con busqueda global:
   - Buscar el nombre de la funcion en todo el proyecto
   - Confirmar que NO existe ninguna referencia activa
   - Revisar si es intencional o legado

3. NOTIFICAR al usuario:
   - Formato obligatorio:
     [CODIGO MUERTO DETECTADO]
     Archivo: <ruta>
     Lineas: <inicio>-<fin>
     Tipo: <funcion/variable/import/prop>
     Razon: <por que es codigo muerto>
     Recommendation: <borrar/archivar>

   - SIEMPRE preguntar antes de eliminar
   - Proporcionar contexto de por que es codigo muerto
```

### Paso 4: Excepciones

Archivos que PUEDEN superar las 600 lineas SIN refactorizar:

- **Rutas de API** con muchos endpoints relacionados
- **Servicios** con metodos estrechamente relacionados
- **Componentes de paginas** donde dividirlo afectaria la legibilidad
- **Schemas de base de datos**

En estos casos:
- Documentar por que es aceptable exceder el umbral
- Incluir comentario en el archivo

## Indicadores de Exito

1. **Refactorizacion:**
   - Archivo principal < 600 lineas
   - Componentes extraidos en archivos separados
   - Build pasa sin errores
   - Ningun import roto

2. **Codigo Muerto:**
   - Usuario notificado de todo codigo muerto encontrado
   - Decision documentada (borrar/archivar/mantener)
   - Si se Borro: ninguna referencia rota en el proyecto

## Integracion con Reglas

Esta skill complementa la **Regla 10 de REGLAS_IMPORTANTES.md**:
- Umbral de 600 lineas obligatorio
- Deteccion de codigo muerto obligatoria
- Formato de notificacion obligatorio

## Archivos de Referencia

- `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` - Regla 10 completa
- `Lookitry_Brain_Vault/Cerebro/Skills/Skills.md` - Indice de skills