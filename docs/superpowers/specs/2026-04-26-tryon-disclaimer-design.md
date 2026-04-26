# SPEC: Disclaimer Checkbox + Modal Legal — Try-On Widget

**Fecha:** 2026-04-26
**Estado:** Aprobado por Sam

---

## 1. Objetivo

Agregar un disclaimer legal obligatorio antes de cada generación en el widget Try-On:
- Proteger a las MARCAS (clientes de Lookitry) de lo que hagan sus clientes finales con las imágenes generadas.
- Proteger a Lookitry de las MARCAS (vía link a /terminos con nueva sección).

---

## 2. Arquitectura de Componentes

### 2.1 Flujo de Usuario

```
Paso Upload → Checkbox sutil debajo del botón
    ↓ (checkbox marcado)
    ↓ (click en link "términos de uso")
    ↓
   Modal (blur de fondo, no sale de página)
    ├── Texto de blindaje marca → cliente final
    ├── Link "Términos y Condiciones de Lookitry" → /terminos (nueva pestaña)
    └── Botón "Cerrar y continuar"

    ↓ (checkbox marcado + botón habilitado)
    ↓
Generación procede normalmente
```

### 2.2 Sesión

- El checkbox es **por sesión**: una vez marcado, todas las generaciones subsecuentes en la misma sesión pasan directo sin mostrar el checkbox nuevamente.
- El timestamp de aceptación se guarda en `sessionStorage` con clave `tryon_terms_accepted`.

---

## 3. Componentes a Crear/Modificar

### 3.1 Nuevo: `LegalDisclaimerModal.tsx`

Componente modal reutilizable.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `brandPrimaryColor: string` — para el botón y acentos

**Contenido:**
- Título: "Uso Responsable de la Generación Virtual"
- Texto de blindaje (ver sección 4)
- Link: "Leer los Términos y Condiciones de Lookitry →" → `/terminos` en nueva pestaña
- Botón: "Cerrar y continuar"

### 3.2 Nuevo: `TermsCheckbox.tsx`

Componente checkbox reutilizable para todos los templates.

**Props:**
- `onAccepted: () => void` — callback cuando se marca
- `isAccepted: boolean`
- `primaryColor: string`
- `textColor: string`
- `mutedColor: string`

**Diseño visual:**
- Checkbox custom con color primario
- Label sutil, no asusta: *"Acepto usar esta tecnología de forma responsable"*
- Link inline: *"términos de uso"* (abre modal)

### 3.3 Modificar: `TryOnWidget.tsx`

- Eliminar auto-generate (línea 191-193): cuando el usuario sube selfie con producto ya seleccionado, ya NO iniciar generación automática. Ahora siempre pasa por el paso upload donde ve el botón + checkbox.
- Agregar estado `termsAccepted: boolean` (inicializado desde sessionStorage)
- Crear lógica `handleGenerate()` que:
  1. Si `termsAccepted === true` → proceder directo
  2. Si `termsAccepted === false` → abrir modal

### 3.4 Modificar: Todos los Templates

Checkbox + link al modal se agregan INMEDIATAMENTE debajo del botón "Probarme esto":

| Template | Archivo |
|----------|---------|
| Bare | `TemplateBare.tsx` |
| LandingEmbed | `TemplateLandingEmbed.tsx` |
| Showcase | `TemplateShowcase.tsx` + `BottomCTAEditorial.tsx` |
| BoldProStudio | `TemplateBoldProStudio.tsx` |
| ModernSidebar | `UploadStepContent.tsx` |
| Widget Banner (LiveTryOnButton) | `LiveTryOnButton.tsx` |

---

## 4. Texto del Modal

### Título
"Uso Responsable de la Generación Virtual"

### Cuerpo
"El probador virtual con IA permite visualizar cómo quedaría una prenda en una persona. Al usar esta función, el CLIENTE FINAL de [NOMBRE DE LA MARCA] acepta que:

- La imagen generada es exclusivamente para uso personal o fines comerciales autorizados por la marca.
- Cuenta con el consentimiento expreso de cualquier persona cuya imagen aparezca en las fotografías que sube.
- No utilizará las generaciones para suplantar identidades, difamar, acosar o infringir derechos de terceros de ninguna forma.
- La marca y Lookitry no se responsabilizan por el uso inadecuado que el cliente final haga de las imágenes generadas.

Las imágenes generadas pueden ser almacenadas de forma anonimizada para mejorar el servicio de IA."

### Link
"Leer los Términos y Condiciones de Lookitry →" → `/terminos` (nueva pestaña, attribute `target="_blank"`)

### Botón
"Cerrar y continuar"

---

## 5. Nueva Sección en /terminos

### Artículo: "Generación Virtual con Inteligencia Artificial"

**Contenido:**

> **Artículo X — Generación Virtual con IA**
>
> El probador virtual de Lookitry utiliza inteligencia artificial para generar imágenes de personas vistiendo productos de la marca suscrita. Al utilizar esta funcionalidad, el USUARIO (marca/negocio) declara y acepta lo siguiente:
>
> **Del uso por el cliente final:**
> - El usuario es responsable exclusivo de obtener y verificar que cuenta con los consentimientos necesarios de cualquier persona cuya imagen sea procesada a través del probador virtual.
> - Lookitry no almacena fotografías de rostros más allá del tiempo necesario para procesar la generación, ni las asocia a datos personales.
> - Lookitry no se hace responsable por el uso que el cliente final del usuario haga de las imágenes generadas, incluyendo pero no limitándose a: suplantación de identidad, difamación, violación de derechos de imagen, o cualquier uso contrario a la ley.
>
> **De la propiedad de las generaciones:**
> - Las imágenes generadas mediante el probador virtual son producidas por un modelo de IA. Su uso comercial queda bajo la responsabilidad del usuario (marca) y sus clientes finales.
> - Lookitry se reserva el derecho de utilizar las generaciones de forma anonimizada y agregada para entrenamiento y mejora de sus modelos de IA, sin asociar dichos datos a información personal del usuario o sus clientes.
>
> **De la limitación de responsabilidad:**
> - La responsabilidad total de Lookitry por cualquier reclamo relacionado con las generaciones de IA no excederá el valor pagado por el usuario en el mes calendario en que ocurra el hecho generador.
>
> Para reportes de uso indebido de la funcionalidad de generación virtual, escribir a: info@lookitry.com

---

## 6. Estados del Componente

| Estado | Visual |
|--------|--------|
| Checkbox desmarcado | Botón deshabilitado (opacity 0.4), checkbox visible |
| Checkbox marcado | Botón habilitado, modal accesible via link |
| Modal abierto | Overlay oscuro, modal centrado, scroll si necesario |
| Términos aceptados (sesión) | No mostrar checkbox, proceder directo |

---

## 7. Checklist de Implementación

- [ ] Crear `LegalDisclaimerModal.tsx`
- [ ] Crear `TermsCheckbox.tsx`
- [ ] Modificar `TryOnWidget.tsx` — eliminar auto-generate, agregar estado termsAccepted
- [ ] Modificar `TemplateBare.tsx` — agregar TermsCheckbox
- [ ] Modificar `TemplateLandingEmbed.tsx` — agregar TermsCheckbox
- [ ] Modificar `TemplateShowcase.tsx` — pasar props de términos a BottomCTAEditorial
- [ ] Modificar `BottomCTAEditorial.tsx` — agregar TermsCheckbox
- [ ] Modificar `TemplateBoldProStudio.tsx` — agregar TermsCheckbox
- [ ] Modificar `UploadStepContent.tsx` — agregar TermsCheckbox
- [ ] Modificar `LiveTryOnButton.tsx` — agregar TermsCheckbox
- [ ] Crear migración/actualización del texto de términos en página `/terminos`
- [ ] Testear en todos los templates
- [ ] Verificar mobile responsive

---

**Autores:** Sammy → Pixel (implementación frontend)
**Última actualización:** 2026-04-26