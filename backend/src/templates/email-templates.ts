/**
 * Templates de email para el sistema de notificaciones
 * Todos los templates incluyen estilos inline para compatibilidad con clientes de email
 */

interface BrandInfo {
  name: string;
  email: string;
}

/**
 * Template base con estilos comunes — paleta light corporativa
 */
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Virtual Try-On SaaS</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f2ee;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f2ee; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF5C3A, #e04e30); padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Virtual Try-On</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 13px;">Probador virtual para tu marca</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f2ee; padding: 20px 32px; text-align: center; border-top: 1px solid #e0dcd7;">
              <p style="margin: 0; color: #888; font-size: 12px;">
                © ${new Date().getFullYear()} Virtual Try-On SaaS. Todos los derechos reservados.
              </p>
              <p style="margin: 8px 0 0 0; color: #888; font-size: 12px;">
                ¿Tienes preguntas? Escríbenos a
                <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A; text-decoration: none;">info@pruebalo.wilkiedevs.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Email de verificación de dirección de correo electrónico.
 * Se envía al registrarse — el usuario debe hacer clic en el link antes de acceder al dashboard.
 */
export const verifyEmailTemplate = (brand: BrandInfo, verifyUrl: string): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Confirma tu correo electrónico</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Gracias por registrarte. Para activar tu cuenta y acceder al dashboard, confirma tu dirección de correo haciendo clic en el botón de abajo.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}"
         style="background-color: #FF5C3A; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Confirmar correo electrónico
      </a>
    </div>
    <p style="color: #888; font-size: 13px; text-align: center;">
      Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.
    </p>
    <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 16px; word-break: break-all;">
      O copia este enlace en tu navegador:<br/>
      <a href="${verifyUrl}" style="color: #FF5C3A;">${verifyUrl}</a>
    </p>
  `;
  return baseTemplate(content);
};

/**
 * Email de bienvenida al registrarse
 */
export const welcomeEmail = (brand: BrandInfo, plan: string, amount: string, daysRemaining: number): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Bienvenido a Virtual Try-On SaaS</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Gracias por registrarte en Virtual Try-On SaaS. Tu cuenta ha sido creada exitosamente.
    </p>
    <div style="background-color: #f5f2ee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF5C3A;">
      <h3 style="color: #0a0a0a; margin-top: 0; font-size: 15px;">Detalles de tu plan:</h3>
      <p style="color: #555; margin: 6px 0;"><strong>Plan:</strong> ${plan}</p>
      <p style="color: #555; margin: 6px 0;"><strong>Email:</strong> ${brand.email}</p>
      <p style="color: #555; margin: 6px 0;"><strong>Monto mensual:</strong> ${amount}</p>
      <p style="color: #555; margin: 6px 0;"><strong>Días restantes:</strong> ${daysRemaining}</p>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Ahora puedes comenzar a configurar tu probador virtual y agregar productos.
    </p>
    <div style="background-color: #fff8f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF5C3A;">
      <p style="color: #c0392b; margin: 0; font-size: 14px;">
        <strong>Instrucciones de pago:</strong><br>
        Para renovar tu suscripción cuando venza, contacta a nuestro equipo de soporte en
        <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A;">info@pruebalo.wilkiedevs.com</a> o WhatsApp.
      </p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com'}/dashboard"
         style="background-color: #FF5C3A; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
        Ir al Dashboard
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de recordatorio 7 días antes del vencimiento (urgencia baja)
 */
export const reminder7DaysEmail = (brand: BrandInfo, daysRemaining: number, amount: string): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Recordatorio de Renovación</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu suscripción vence en <strong>${daysRemaining} días</strong>. Para continuar disfrutando del servicio sin interrupciones, por favor renueva tu suscripción.
    </p>
    <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="color: #92400e; margin-top: 0; font-size: 15px;">Información de Pago:</h3>
      <p style="color: #92400e; margin: 6px 0;"><strong>Monto:</strong> ${amount}</p>
      <p style="color: #92400e; margin: 6px 0;"><strong>Días restantes:</strong> ${daysRemaining}</p>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      <strong>Instrucciones de pago:</strong><br>
      1. Contacta a nuestro equipo en <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A;">info@pruebalo.wilkiedevs.com</a> o WhatsApp<br>
      2. Indica tu nombre de marca y el monto a pagar<br>
      3. Recibirás instrucciones para realizar la transferencia<br>
      4. Una vez confirmado el pago, tu suscripción será renovada automáticamente
    </p>
  `;
  return baseTemplate(content);
};

/**
 * Email de recordatorio 3 días antes del vencimiento (urgencia alta)
 */
export const reminder3DaysEmail = (brand: BrandInfo, daysRemaining: number, amount: string): string => {
  const content = `
    <h2 style="color: #c0392b; margin-top: 0; font-size: 20px;">Renovación Urgente Requerida</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu suscripción vence en <strong style="color: #c0392b;">${daysRemaining} días</strong>.
      Es importante que renueves pronto para evitar la suspensión de tu servicio.
    </p>
    <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c0392b;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">Información de Pago:</h3>
      <p style="color: #c0392b; margin: 6px 0;"><strong>Monto:</strong> ${amount}</p>
      <p style="color: #c0392b; margin: 6px 0;"><strong>Días restantes:</strong> ${daysRemaining}</p>
      <p style="color: #c0392b; margin: 14px 0 0 0; font-size: 13px;"><strong>Importante:</strong> Si no renuevas antes del vencimiento, tu cuenta será suspendida y tu probador virtual dejará de funcionar.</p>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      <strong>Instrucciones de pago (URGENTE):</strong><br>
      1. Contacta <strong>inmediatamente</strong> a <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A;">info@pruebalo.wilkiedevs.com</a> o WhatsApp<br>
      2. Indica tu nombre de marca: <strong>${brand.name}</strong><br>
      3. Monto a pagar: <strong>${amount}</strong>
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:info@pruebalo.wilkiedevs.com"
         style="background-color: #FF5C3A; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
        Contactar Soporte Ahora
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de notificación el día del vencimiento
 */
export const expirationTodayEmail = (brand: BrandInfo, amount: string): string => {
  const content = `
    <h2 style="color: #c0392b; margin-top: 0; font-size: 20px;">Tu Suscripción Vence Hoy</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu suscripción <strong style="color: #c0392b;">vence hoy</strong>.
      Si no renuevas inmediatamente, tu cuenta será suspendida y perderás acceso al servicio.
    </p>
    <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c0392b;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">Acción Requerida:</h3>
      <p style="color: #c0392b; margin: 6px 0;"><strong>Monto a pagar:</strong> ${amount}</p>
      <p style="color: #c0392b; margin: 14px 0 0 0; font-size: 13px;"><strong>Urgente:</strong> Renueva ahora para evitar la suspensión de tu servicio.</p>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Contacta <strong>AHORA MISMO</strong> a <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A;">info@pruebalo.wilkiedevs.com</a> o WhatsApp indicando tu marca: <strong>${brand.name}</strong>
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:info@pruebalo.wilkiedevs.com"
         style="background-color: #FF5C3A; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
        Renovar Ahora
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de notificación de suspensión
 */
export const suspensionEmail = (brand: BrandInfo, amount: string): string => {
  const content = `
    <h2 style="color: #c0392b; margin-top: 0; font-size: 20px;">Cuenta Suspendida</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu cuenta ha sido suspendida debido a que tu suscripción ha vencido.
    </p>
    <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c0392b;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">¿Qué significa esto?</h3>
      <ul style="color: #c0392b; margin: 10px 0; padding-left: 20px; font-size: 14px;">
        <li>Tu probador virtual ya no está disponible</li>
        <li>No puedes acceder a tu dashboard</li>
        <li>Tus datos se mantendrán por 90 días</li>
      </ul>
      <p style="color: #c0392b; margin: 14px 0 0 0; font-size: 14px;"><strong>Monto para reactivar:</strong> ${amount}</p>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Para reactivar tu cuenta, contacta a <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A;">info@pruebalo.wilkiedevs.com</a> o WhatsApp indicando tu marca: <strong>${brand.name}</strong>. Tu cuenta será reactivada inmediatamente después de confirmar el pago.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:info@pruebalo.wilkiedevs.com"
         style="background-color: #FF5C3A; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
        Reactivar Cuenta
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de confirmación de renovación exitosa
 */
export const renewalConfirmationEmail = (brand: BrandInfo, newExpirationDate: string, amount: string, daysRemaining: number): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Renovación Exitosa</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu suscripción ha sido renovada exitosamente.
    </p>
    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="color: #065f46; margin-top: 0; font-size: 15px;">Detalles de la Renovación:</h3>
      <p style="color: #065f46; margin: 6px 0;"><strong>Monto pagado:</strong> ${amount}</p>
      <p style="color: #065f46; margin: 6px 0;"><strong>Nueva fecha de vencimiento:</strong> ${newExpirationDate}</p>
      <p style="color: #065f46; margin: 6px 0;"><strong>Días restantes:</strong> ${daysRemaining}</p>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu servicio continuará sin interrupciones. Gracias por confiar en nosotros.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com'}/dashboard"
         style="background-color: #FF5C3A; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
        Ir al Dashboard
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de alerta al alcanzar 80% del límite de generaciones
 */
export const usageAlert80Email = (brand: BrandInfo, used: number, limit: number, daysRemaining: number, amount: string): string => {
  const percentage = Math.round((used / limit) * 100);
  const remaining = limit - used;
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Alerta de Uso — 80%</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Has alcanzado el <strong>${percentage}%</strong> de tu límite mensual de generaciones.
    </p>
    <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="color: #92400e; margin-top: 0; font-size: 15px;">Uso Actual:</h3>
      <p style="color: #92400e; margin: 6px 0;"><strong>Generaciones usadas:</strong> ${used} de ${limit}</p>
      <p style="color: #92400e; margin: 6px 0;"><strong>Generaciones restantes:</strong> ${remaining}</p>
      <div style="background-color: #ffffff; height: 12px; border-radius: 6px; margin: 14px 0; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #FF5C3A, #f59e0b); height: 100%; width: ${percentage}%; border-radius: 6px;"></div>
      </div>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Considera actualizar a un plan superior si necesitas más generaciones este mes.
    </p>
    <div style="background-color: #f5f2ee; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #555; margin: 0; font-size: 14px;"><strong>Días restantes de suscripción:</strong> ${daysRemaining}</p>
      <p style="color: #555; margin: 6px 0 0 0; font-size: 14px;"><strong>Monto de renovación:</strong> ${amount}</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de alerta al alcanzar 100% del límite de generaciones
 */
export const usageAlert100Email = (brand: BrandInfo, limit: number, daysRemaining: number, amount: string): string => {
  const content = `
    <h2 style="color: #c0392b; margin-top: 0; font-size: 20px;">Límite de Generaciones Alcanzado</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Has alcanzado el <strong>100%</strong> de tu límite mensual de generaciones (${limit} generaciones).
    </p>
    <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c0392b;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">¿Qué significa esto?</h3>
      <p style="color: #c0392b; margin: 6px 0; font-size: 14px;">No podrás generar más imágenes hasta el próximo mes o hasta que actualices tu plan.</p>
      <div style="background: linear-gradient(90deg, #FF5C3A, #c0392b); height: 12px; border-radius: 6px; margin: 14px 0;"></div>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;"><strong>Opciones:</strong></p>
    <ul style="color: #555; line-height: 1.8; font-size: 15px;">
      <li>Esperar hasta el próximo mes (el contador se resetea el día 1)</li>
      <li>Actualizar a un plan superior para obtener más generaciones</li>
    </ul>
    <div style="background-color: #f5f2ee; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #555; margin: 0; font-size: 14px;"><strong>Días restantes de suscripción:</strong> ${daysRemaining}</p>
      <p style="color: #555; margin: 6px 0 0 0; font-size: 14px;"><strong>Monto de renovación:</strong> ${amount}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:info@pruebalo.wilkiedevs.com"
         style="background-color: #FF5C3A; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
        Actualizar Plan
      </a>
    </div>
  `;
  return baseTemplate(content);
};


/**
 * Email de bienvenida enviado por el admin al crear una marca manualmente.
 * Incluye credenciales de acceso y detalles del período de prueba.
 */
export const adminWelcomeEmail = (
  brand: BrandInfo,
  password: string,
  plan: string,
  trialDays: number,
  trialEndDate: string
): string => {
  const dashboardUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Bienvenido a Virtual Try-On SaaS</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu cuenta ha sido creada. A continuación encontrarás tus datos de acceso y los detalles de tu período de prueba.
    </p>

    <div style="background-color: #fff8f6; border-left: 4px solid #FF5C3A; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">Datos de acceso</h3>
      <p style="color: #333; margin: 6px 0; font-size: 15px;"><strong>Email:</strong> ${brand.email}</p>
      <p style="color: #333; margin: 6px 0; font-size: 15px;"><strong>Contraseña:</strong> <code style="background:#f5f2ee;padding:2px 8px;border-radius:4px;font-size:14px;border:1px solid #e0dcd7;">${password}</code></p>
      <p style="color: #888; margin: 12px 0 0 0; font-size: 13px;">
        Te recomendamos cambiar tu contraseña desde la configuración de tu cuenta una vez que ingreses.
      </p>
    </div>

    <div style="background-color: #f5f2ee; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #0a0a0a; margin-top: 0; font-size: 15px;">Detalles de tu plan</h3>
      <p style="color: #555; margin: 6px 0;"><strong>Plan:</strong> ${plan}</p>
      <p style="color: #555; margin: 6px 0;"><strong>Período de prueba:</strong> ${trialDays} días</p>
      <p style="color: #555; margin: 6px 0;"><strong>Vence el:</strong> ${trialEndDate}</p>
    </div>

    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Durante tu período de prueba puedes explorar todas las funcionalidades: subir productos, configurar tu probador virtual y compartirlo con tus clientes.
    </p>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Renovación:</strong> Para continuar usando el servicio al finalizar el período de prueba, contáctanos por WhatsApp o email y coordinamos el pago.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${dashboardUrl}/dashboard"
         style="background-color: #FF5C3A; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Ingresar al Dashboard
      </a>
    </div>

    <p style="color: #aaa; font-size: 13px; text-align: center; margin-top: 24px;">
      ¿Tienes preguntas? Escríbenos a
      <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A; text-decoration: none;">info@pruebalo.wilkiedevs.com</a>
      o por WhatsApp al +57 310 543 6281.
    </p>
  `;
  return baseTemplate(content);
};

/**
 * Email de reset de contraseña para administradores del panel.
 * Se envía cuando un superadmin solicita reenviar credenciales.
 */
export const adminPasswordResetEmail = (
  adminName: string,
  adminEmail: string,
  newPassword: string,
): string => {
  const appUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Restablecimiento de contraseña</h2>
    <p style="color: #666666; line-height: 1.6; font-size: 16px;">
      Hola <strong>${adminName}</strong>,
    </p>
    <p style="color: #666666; line-height: 1.6; font-size: 16px;">
      Se ha generado una nueva contraseña temporal para tu cuenta de administrador.
    </p>

    <div style="background-color: #fff4f2; border-left: 4px solid #FF5C3A; padding: 20px; border-radius: 6px; margin: 24px 0;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">Nuevas credenciales de acceso</h3>
      <p style="color: #374151; margin: 6px 0; font-size: 15px;"><strong>Email:</strong> ${adminEmail}</p>
      <p style="color: #374151; margin: 6px 0; font-size: 15px;">
        <strong>Contraseña temporal:</strong>
        <code style="background:#f3f4f6;padding:3px 10px;border-radius:4px;font-size:14px;margin-left:6px;">${newPassword}</code>
      </p>
    </div>

    <div style="background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Importante:</strong> Esta contraseña es temporal. Por seguridad, cámbiala desde la configuración de tu cuenta inmediatamente después de iniciar sesión.
      </p>
    </div>

    <p style="color: #666666; line-height: 1.6; font-size: 15px;">
      Si no solicitaste este cambio, contacta al administrador principal de inmediato.
    </p>

    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${appUrl}/admin/login"
         style="background-color: #FF5C3A; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Ir al panel de administración
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 24px;">
      ¿Tienes preguntas? Escríbenos a
      <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A;">info@pruebalo.wilkiedevs.com</a>
    </p>
  `;
  return baseTemplate(content);
};

/**
 * Email de aviso previo de eliminación de mini-landing (a los 75 días de suspensión).
 * Informa que quedan N días antes de que la mini-landing sea eliminada definitivamente.
 */
export const landingDeletionWarningEmail = (
  brand: BrandInfo,
  diasRestantes: number,
  frontendUrl: string
): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Tu mini-landing será eliminada en ${diasRestantes} días</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu suscripción lleva más de 75 días suspendida. Si no renuevas antes de que se cumplan 90 días desde la suspensión,
      tu mini-landing y los productos asociados serán eliminados de forma definitiva.
    </p>

    <div style="background-color: #fff8f0; border-left: 4px solid #FF5C3A; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="color: #c0392b; margin: 0; font-size: 15px; font-weight: bold;">
        Tiempo restante para renovar: ${diasRestantes} días
      </p>
      <p style="color: #888; margin: 8px 0 0 0; font-size: 13px;">
        Después de este plazo no será posible recuperar tu página ni tus productos.
      </p>
    </div>

    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Para reactivar tu cuenta y conservar tu mini-landing, renueva tu suscripción desde el dashboard o contáctanos.
    </p>

    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${frontendUrl}/dashboard/checkout"
         style="background-color: #FF5C3A; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Renovar suscripción
      </a>
    </div>

    <p style="color: #aaa; font-size: 13px; text-align: center; margin-top: 24px;">
      ¿Tienes preguntas? Escríbenos a
      <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A; text-decoration: none;">info@pruebalo.wilkiedevs.com</a>
    </p>
  `;
  return baseTemplate(content);
};

/**
 * Email de notificación de eliminación definitiva de mini-landing (a los 90 días).
 * Se envía cuando la mini-landing ya fue eliminada del sistema.
 */
export const landingDeletedNoticeEmail = (brand: BrandInfo): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Tu mini-landing ha sido eliminada</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Han transcurrido 90 días desde que tu suscripción fue suspendida. Como te informamos previamente,
      tu mini-landing y los productos asociados han sido eliminados definitivamente de nuestros servidores.
    </p>

    <div style="background-color: #f5f2ee; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="color: #555; margin: 0; font-size: 15px;">
        Si deseas volver a usar Lookitry, puedes crear una nueva cuenta y configurar tu mini-landing desde cero.
      </p>
    </div>

    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Lamentamos que no hayas podido continuar con nosotros. Si tienes alguna pregunta o quieres reactivar tu cuenta,
      no dudes en contactarnos.
    </p>

    <p style="color: #aaa; font-size: 13px; text-align: center; margin-top: 24px;">
      Escríbenos a
      <a href="mailto:info@pruebalo.wilkiedevs.com" style="color: #FF5C3A; text-decoration: none;">info@pruebalo.wilkiedevs.com</a>
    </p>
  `;
  return baseTemplate(content);
};
