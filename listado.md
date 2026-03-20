[8:27 a. m., 20/3/2026] Sam Wilkie: Acabo de hacer un test de compra de una minilanding desde el menú de usuario en la pestaña "mi pagina" pero no me dio el acceso a la página comprada y tampoco me reportó la compra a pesar de que me realizó el cobro, tampoco me llegó correo electrónico ni comprobante, verifica también que esté enviando los comprobantes de compra de cada check-out, en este caso el check-out usado fue el interior landing.
[10:43 a. m., 20/3/2026] Sam Wilkie: Verificación de seguridad fallida a la hora de crear una nueva cuenta en el registro trial
[10:45 a. m., 20/3/2026] Sam Wilkie: En el footer colocar teléfono y correo en círculos a la lado de  tiktok e Instagram, y que en el mobile los titles del que queden centrados
[10:49 a. m., 20/3/2026] Sam Wilkie: En el header mobile ocultar el botón contratar ahora y dejar el de iniciar sesión en ese lugar con el mismo color que el botón anterior, y asegurate que el header este responsive y no scroll down en el mobile, también oculta el botón de subir en mobile
[10:54 a. m., 20/3/2026] Sam Wilkie: En el ejemplo de template del inicio coloca imágenes reales de cada producto camisa lino beis, zapatillas blancas, bolso oscuro café, generalas tu, si no puedes hacerlo dime y yo las hago.
[10:58 a. m., 20/3/2026] Sam Wilkie: Haz lo mismo en la parte de promo landing donde dice "Tu tienda online,
sin pagar un diseñador" coloca imágenes y has que se vea más realista para que las personas se hagan una idea general de como quedaría y no que se vea un como wireframe...
[11:01 a. m., 20/3/2026] Sam Wilkie: El el faq sección pagos en la pregunta ¿Cuáles son los precios de los planes? Coloca los valores dinámicos correspondientes que se manejan en el dashboard admin
[11:02 a. m., 20/3/2026] Sam Wilkie: Lo mismo con ¿Hay descuentos por pagar varios meses?
[11:02 a. m., 20/3/2026] Sam Wilkie: En que métodos aceptan agrega también PayPal
[11:03 a. m., 20/3/2026] Sam Wilkie: En la pregunta ¿Cuántas generaciones incluye cada plan? Coloca también los datos dinámicos
[11:05 a. m., 20/3/2026] Sam Wilkie: ¿Cuántos productos puedo tener en el probador? También coloca datos dinámicos
[11:09 a. m., 20/3/2026] Sam Wilkie: En la página de about cambiar de 120 marcas a 30 y has un promedio para el total de generaciones para que lo corrijas también
[11:14 a. m., 20/3/2026] Sam Wilkie: En planes agrega el método math celi para redondear los precios a dólares y haz lo mismo en todo los check-out internos como externos
[11:23 a. m., 20/3/2026] Sam Wilkie: A partir de aquí culminan los cambios en la página principal y comienzan los cambios en el panel/dashboard de administrador.

En el panel de administración analíticas el Top marcas por generaciones no se está actualizando y mostrándome los datos que se están generando.
[11:25 a. m., 20/3/2026] Sam Wilkie: En el panel promociones no funciona el responsive en Mobile.
[11:25 a. m., 20/3/2026] Sam Wilkie: Lo mismo para cupones
[11:30 a. m., 20/3/2026] Sam Wilkie: En la pestaña de configuración de sistema en la pestaña landing, elimina el módulo de cambiar precios ya que esa información ya se encuentra incluida en la sección pricing y en donde dice URL pública , añádeme un campo para colocar el nombre empresa que sea clicleable con la URL previamente configurada , y elimina el módulo de cambiar moneda
[11:30 a. m., 20/3/2026] Sam Wilkie: Hasta aquí los cambios del panel administrativo
[11:36 a. m., 20/3/2026] Sam Wilkie: En el dashboard de usuario En el panel de generaciones al descargar la imagen y en el widgets de generación asegúrate que en el trial la marca de agua quede correctamente ubicada como la imagen ejemplo, y lo mismo con la marca de agua basic, asegúrate de no romper con el resto de la lógica para Pro.
[11:45 a. m., 20/3/2026] Sam Wilkie: En la previa visualización de la mini landing, no se está cumpliendo la lógica que al cumplirse el tiempo de previsualización redireccione al check-out de landing y no permita volver a visualizarla más a menos que se compre
[11:46 a. m., 20/3/2026] Sam Wilkie: Ya hay una página configurada con el aviso, verifica porq no está funcionando.
[11:50 a. m., 20/3/2026] Sam Wilkie: Audita el editor visual de los templates de mini landing que esten funcionando  correctamente  todos los campos de edición en todos los templates.
[11:55 a. m., 20/3/2026] Sam Wilkie: Coloca un tooltip en badge en la sesión de configuración para añadir productos donde se especifique que es o para que sirve
En la opción de edición añade una opciones para recorte en el widget de generación

Añade o verifica la lógica de limitación a una generación por producto en widget de generaciones, en todos los planes porque ya debería estar implementa y Revisa el reporte de problemas con la imagen que no está notificando que se envió el reporte, aunque en el panel de administración si aparece como realizado

Verifica porq las IA no como plexpercity pueden acceder a mi sitio web "No puedo acceder al contenido de tu sitio ahora mismo (parece que el subdominio o DNS no está respondiendo públicamente), así que no puedo ver ni probar lo que ofrece .1. Revisa que el sitio sea accesible desde fueraPara poder analizarlo necesito que cumpla estas condiciones:El subdominio pruébalo.wilkiedevs.com o su versión punycode (xn--prubalo-8za.wilkiedevs.com) debe apuntar a una IP pública en tu DNS. El servidor donde lo tienes (VPS, hosting, Vercel, etc.) debe aceptar peticiones HTTP/HTTPS para ese host y devolver algo distinto a error 4xx/5xx. Un ejemplo típico: si usas Cloudflare, asegúrate de tener un registro A o CNAME para pruébalo apuntando al servidor correcto y que el proxy esté bien configurado. "

necesito implementar un sistema de Custom Domains exclusivo para usuarios con plan PRO.
​Middleware de Identificación: Crea un middleware que capture req.headers.host. Debe consultar en la base de datos (MongoDB/PostgreSQL) si ese host coincide con la columna custom_domain de un usuario con plan: 'PRO'.
​Prioridad de Rutas: Si el host no es el dominio principal, debe cargar la mini-landing del usuario PRO. Si es el dominio principal, sigue el flujo normal.
​Validación de Seguridad: Implementa una limpieza del string del dominio para evitar ataques de inyección.
​Proxy Trust: Configura app.set('trust proxy', true) para que Express lea correctamente el host enviado por Nginx/Cloudflare."
​2. Dónde colocar esta opción en el Panel (UX)
​Para que el usuario perciba el valor de ser PRO, la ubicación es clave:
​Sección "Mi página" del panel de usuario, Crea una pestaña llamada "Identidad y Dominio".
​Interruptor de Estado: Si el usuario es gratuito, muestra el campo bloqueado (con un candado) y un botón brillante: "Desbloquear con Plan PRO".
​Feedback Visual: Una vez activo, muestra un indicador de estado: Pendiente de Configuración, Verificando DNS o Activo (Seguro).
​3. Instrucciones Técnicas para el Usuario (Contenido del Panel)
​Estas son las instrucciones que tus clientes verán dentro de su panel una vez que suban a PRO. Te sugiero colocarlas en un Modal o un Card informativo:
​🌐 Configura tu Dominio Personalizado
​Solo disponible para usuarios PRO
​Para que tu probador virtual y mini-landing funcionen bajo tu propio nombre (ej: probador.tu-marca.com), sigue estos pasos:
​Ingresa tu dominio: Escribe el dominio o subdominio que deseas usar en el campo de arriba y guarda los cambios.
​Configura tus DNS: Entra al panel de tu proveedor de dominio (GoDaddy, Namecheap, etc.) y agrega un nuevo registro:
​Tipo: CNAME
​Nombre/Host: probador (o el nombre que prefieras para tu subdominio)
​Valor/Destino: cname.wilkiedevs.com
​TTL: Automático o 3600.
​Espera la Propagación: Los cambios pueden tardar de 5 minutos a 24 horas. Nuestro sistema generará automáticamente tu certificado de seguridad SSL (HTTPS) sin costo adicional.

[12:15 p. m., 20/3/2026] Sam Wilkie: Neecesito que el editor sea más estético y si es posible para mejorar el UI/UX usar tablas en "mi página"
[12:22 p. m., 20/3/2026] Sam Wilkie: En el panel de configuración del template del widget tryon en la pestaña de apariencia predeterminada no aparece bare como defecto a pesar que es la única disponible, debería aparecer así visualmente también. Y el color predeterminado debería ser también blanco y negro
[12:24 p. m., 20/3/2026] Sam Wilkie: Me aparece este error " Application error: a client-side exception has occurred (see the browser console for more information)." Al intentar hacer el cambio de un plan basic a pro desde el panel de suscripción