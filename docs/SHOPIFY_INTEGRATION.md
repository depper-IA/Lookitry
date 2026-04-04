# Guía de Integración Lookitry para Shopify

Esta guía te帮助你 integrar el probador virtual de Lookitry en tu tienda Shopify en menos de 10 minutos.

## Requisitos Previos

- Cuenta activa de Lookitry (plan Pro o Enterprise recomendado)
- Acceso a Shopify Admin con permisos para editar temas
- Al menos 1 producto cargado en tu panel de Lookitry

---

## Método 1: Script Incrustado (Recomendado)

Este método funciona con cualquier tema de Shopify y no requiere conocimiento de código.

### Paso 1: Obtener tu código

Desde tu panel de Lookitry:
1. Ve a **Configuración → Inyección de código**
2. Selecciona **"Widget inteligente"**
3. Copia el código generado (se ve algo así):

```html
<div id="lookitry-tester-container" data-slug="tu-marca"></div>
<script src="https://lookitry.com/widget.js" async defer></script>
```

### Paso 2: Agregar al tema de Shopify

1. En Shopify Admin, ve a **Tienda en línea → Temas**
2. Haz clic en los tres puntos del tema actual → **Personalizar**
3. En el menú superior, selecciona **Configuración → Archivos de tema**
4. Desplázate hasta abajo y haz clic en **Añadir un archivo**
5. Sube un archivo de texto vacío (puedes crearlo en el bloc de notas)
6. Vuelve al editor y selecciona **Configuración → Código de tema**
7. Busca el archivo `theme.liquid` o `index.json`
8. Busca la etiqueta `</body>` (justo antes de cerrar el HTML)
9. Pega tu código de Lookitry justo antes de `</body>`
10. Guarda los cambios

### Paso 3: Verificar

Abre tu tienda en una pestaña nueva y verifica que el widget aparezca en la página de productos.

---

## Método 2: Sección Personalizada (Themes 2.0)

Para temas más modernos de Shopify (Online Store 2.0):

### Paso 1: Crear sección personalizada

1. En el editor de temas de Shopify, haz clic en **Agregar sección**
2. Busca al final de la lista **"Custom Liquid"** o **"Liquid personalizado"**
3. Arrastra la sección a donde quieras que aparezca (recomendado: debajo del botón de comprar)
4. En el campo de texto, pega tu código de Lookitry:

```html
<div id="lookitry-tester-container" data-slug="tu-marca"></div>
<script src="https://lookitry.com/widget.js" async defer></script>
```

### Paso 2: Estilos opcionales

Si necesitas ajustar el tamaño, añade este CSS en la sección:

```css
<style>
  #lookitry-tester-container {
    max-width: 100%;
    margin-top: 20px;
  }
</style>
```

---

## Método 3: Botón Flotante

Si prefieres un botón que abra el probador en un modal:

### Paso 1: Agregar el código

En `theme.liquid`, antes de `</body>`:

```html
<style>
  #lookitry-float-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: #FF5C3A;
    color: white;
    padding: 15px 25px;
    border-radius: 50px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
</style>

<div id="lookitry-float-btn" onclick="openLookitry()">
  🛍️ Probar esta ropa
</div>

<div id="lookitry-modal" style="display:none; position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,0.8);">
  <iframe src="https://lookitry.com/embed/tu-marca" style="width:100%; height:100%; border:none;"></iframe>
  <button onclick="closeLookitry()" style="position:absolute; top:20px; right:20px; background:white; padding:10px 20px; border-radius:8px;">✕ Cerrar</button>
</div>

<script>
  function openLookitry() {
    document.getElementById('lookitry-modal').style.display = 'block';
  }
  function closeLookitry() {
    document.getElementById('lookitry-modal').style.display = 'none';
  }
</script>
```

Reemplaza `tu-marca` por tu slug real.

---

## Solución de Problemas

### El widget no aparece

1. Verifica que tu código sea correcto (revisa el slug)
2. Confirma que el producto esté cargado en Lookitry
3. Limpia la caché del navegador e intenta de nuevo
4. Revisa la consola del navegador (F12) para ver errores

### El widget aparece pero no carga productos

1. Verifica que el producto tenga foto cargada en Lookitry
2. Confirma que el producto está "activo" en tu panel
3. Revisa que la imagen del producto sea de alta calidad (mínimo 500x500px)

### Conflictos con el tema

Algunos temas pueden tener conflictos con JavaScript. Prueba estos ajustes:

```html
<script>
  // Ejecutar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    var script = document.createElement('script');
    script.src = 'https://lookitry.com/widget.js';
    script.async = true;
    document.head.appendChild(script);
  });
</script>
```

---

## Personalización

### Cambiar colores

En tu panel de Lookitry ve a **Configuración → Apariencia** para ajustar:
- Color primario
- Color secundario
- Template del widget

### Cambiar posición del widget

Edita el código y cambia la ubicación donde pegaste el snippet.

---

## Soporte

Si tienes dificultades con la integración:
- **WhatsApp:** +57 310 543 6281
- **Email:** info@lookitry.com

Nuestro equipo de soporte te ayuda sin costo adicional.
