/**
 * Templates de email para el sistema de notificaciones
 * Todos los templates incluyen estilos inline para compatibilidad con clientes de email
 */

interface BrandInfo {
  name: string;
  email: string;
}

/**
 * Template base con estilos comunes — paleta corporativa LOOKITRY (negro y acento naranja)
 */
const LOGO_URL = 'https://lookitry.com/logo.svg';
const APP_URL = process.env.FRONTEND_URL || 'https://lookitry.com';
const ACCENT_COLOR = '#FF5C3A';

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LOOKITRY</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f2ee;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f2ee; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header con logo - Fondo negro para resaltar logo blanco -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 28px 32px; text-align: center;">
              <a href="${APP_URL}" style="text-decoration: none; display: inline-block;">
                <img src="${LOGO_URL}" alt="LOOKITRY" width="140" height="auto"
                     style="display: block; margin: 0 auto; max-height: 48px; object-fit: contain;"
                     onerror="this.style.display='none'" />
              </a>
              <p style="color: rgba(255,255,255,0.6); margin: 12px 0 0 0; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; font-weight: bold;">Probador virtual para tu marca</p>
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
                © ${new Date().getFullYear()} LOOKITRY. Todos los derechos reservados.
              </p>
              <p style="margin: 8px 0 0 0; color: #888; font-size: 12px;">
                ¿Tienes preguntas? Escríbenos a
                <a href="mailto:info@lookitry.com" style="color: ${ACCENT_COLOR}; text-decoration: none;">info@lookitry.com</a>
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
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Confirmar correo electrónico
      </a>
    </div>
    <p style="color: #888; font-size: 13px; text-align: center;">
      Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.
    </p>
    <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 16px; word-break: break-all;">
      O copia este enlace en tu navegador:<br/>
      <a href="${verifyUrl}" style="color: ${ACCENT_COLOR};">${verifyUrl}</a>
    </p>
  `;
  return baseTemplate(content);
};

/**
 * Email de bienvenida al registrarse
 */
export const welcomeEmail = (brand: BrandInfo, plan: string, amount: string, daysRemaining: number): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Bienvenido a LOOKITRY</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Gracias por registrarte en LOOKITRY. Tu cuenta ha sido creada exitosamente.
    </p>
    <div style="background-color: #f5f2ee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${ACCENT_COLOR};">
      <h3 style="color: #0a0a0a; margin-top: 0; font-size: 15px;">Detalles de tu plan:</h3>
      <p style="color: #555; margin: 6px 0;"><strong>Plan:</strong> ${plan}</p>
      <p style="color: #555; margin: 6px 0;"><strong>Email:</strong> ${brand.email}</p>
      <p style="color: #555; margin: 6px 0;"><strong>Monto mensual:</strong> ${amount}</p>
      <p style="color: #555; margin: 6px 0;"><strong>Días restantes:</strong> ${daysRemaining}</p>
    </div>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Ahora puedes comenzar a configurar tu probador virtual y agregar productos.
    </p>
    <div style="background-color: #fff8f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${ACCENT_COLOR};">
      <p style="color: #c0392b; margin: 0; font-size: 14px;">
        <strong>Instrucciones de pago:</strong><br>
        Para renovar tu suscripción cuando venza, puedes hacerlo directamente desde el dashboard o contactándonos.
      </p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
        Ir al Dashboard
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de recordatorio 7 días antes del vencimiento
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
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/checkout"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Renovar suscripción
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de recordatorio 3 días antes del vencimiento
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
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/checkout"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Renovar Ahora
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
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/checkout"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Renovar Inmediatamente
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
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/checkout"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
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
      <a href="${APP_URL}/dashboard"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 14px;">
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
        <div style="background: linear-gradient(90deg, ${ACCENT_COLOR}, #f59e0b); height: 100%; width: ${percentage}%; border-radius: 6px;"></div>
      </div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/checkout"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Actualizar Plan para más créditos
      </a>
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
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">Límite excedido</h3>
      <p style="color: #c0392b; margin: 6px 0; font-size: 14px;">No podrás generar más imágenes hasta el próximo mes o hasta que actualices tu plan.</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/checkout"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Obtener más generaciones ahora
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de bienvenida enviado por el admin al crear una marca manualmente.
 */
export const adminWelcomeEmail = (
  brand: BrandInfo,
  password: string,
  plan: string,
  trialDays: number,
  trialEndDate: string
): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Bienvenido a LOOKITRY</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu cuenta ha sido creada. A continuación encontrarás tus datos de acceso y los detalles de tu período de prueba.
    </p>

    <div style="background-color: #fff8f6; border-left: 4px solid ${ACCENT_COLOR}; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">Datos de acceso</h3>
      <p style="color: #333; margin: 6px 0; font-size: 15px;"><strong>Email:</strong> ${brand.email}</p>
      <p style="color: #333; margin: 6px 0; font-size: 15px;"><strong>Contraseña:</strong> <code style="background:#f5f2ee;padding:2px 8px;border-radius:4px;font-size:14px;border:1px solid #e0dcd7;">${password}</code></p>
    </div>

    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${APP_URL}/dashboard"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Ingresar al Dashboard
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de reset de contraseña para administradores del panel.
 */
export const adminPasswordResetEmail = (
  adminName: string,
  adminEmail: string,
  newPassword: string,
): string => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Restablecimiento de contraseña</h2>
    <p style="color: #666666; line-height: 1.6; font-size: 16px;">
      Hola <strong>${adminName}</strong>,
    </p>
    <div style="background-color: #fff4f2; border-left: 4px solid ${ACCENT_COLOR}; padding: 20px; border-radius: 6px; margin: 24px 0;">
      <h3 style="color: #c0392b; margin-top: 0; font-size: 15px;">Nuevas credenciales</h3>
      <p style="color: #374151; margin: 6px 0; font-size: 15px;"><strong>Email:</strong> ${adminEmail}</p>
      <p style="color: #374151; margin: 6px 0; font-size: 15px;"><strong>Contraseña:</strong> <code style="background:#f3f4f6;padding:3px 10px;border-radius:4px;font-size:14px;">${newPassword}</code></p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/admin/login"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Ir al panel admin
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de aviso previo de eliminación de mini-landing
 */
export const landingDeletionWarningEmail = (
  brand: BrandInfo,
  diasRestantes: number,
  frontendUrl: string
): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Tu mini-landing será eliminada en ${diasRestantes} días</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu suscripción lleva más de 75 días suspendida. Si no renuevas antes de que se cumplan 90 días, tu mini-landing será eliminada definitivamente.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/checkout"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Conservar mi mini-landing
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de recuperación de contraseña.
 */
export const passwordResetTemplate = (brand: BrandInfo, resetUrl: string): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Restablecer contraseña</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Recibimos una solicitud para restablecer tu contraseña en LOOKITRY.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Restablecer contraseña
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de confirmación de activación de mini-landing
 */
export const landingActivatedEmail = (
  brand: BrandInfo,
  landingUrl: string,
  plan: string
): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">¡Tu mini-landing está activa!</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Hola <strong>${brand.name}</strong>,
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Tu pago fue procesado correctamente y tu mini-landing ya está publicada y lista para recibir clientes.
    </p>

    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #10b981;">
      <h3 style="color: #065f46; margin-top: 0; font-size: 15px;">Detalles de tu activación:</h3>
      <p style="color: #065f46; margin: 6px 0;"><strong>Plan activo:</strong> ${plan}</p>
      <p style="color: #065f46; margin: 6px 0;"><strong>Tu página:</strong>
        <a href="${landingUrl}" style="color: ${ACCENT_COLOR}; text-decoration: none;">${landingUrl}</a>
      </p>
    </div>

    <div style="background-color: #fff8f6; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${ACCENT_COLOR};">
      <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
        <strong>¿Qué puedes hacer ahora?</strong><br/>
        Personaliza los colores, logo y plantilla de tu página desde el dashboard.
        Comparte el enlace en tus redes sociales y empieza a recibir visitas.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${landingUrl}"
         style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px; margin-right: 12px;">
        Ver mi página
      </a>
      <a href="${APP_URL}/dashboard/mi-pagina"
         style="background-color: #0a0a0a; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;">
        Personalizar
      </a>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email de notificación de eliminación definitiva de mini-landing
 */
export const landingDeletedNoticeEmail = (brand: BrandInfo): string => {
  const content = `
    <h2 style="color: #0a0a0a; margin-top: 0; font-size: 20px;">Tu mini-landing ha sido eliminada</h2>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Han transcurrido 90 días desde que tu suscripción fue suspendida. Tu mini-landing ha sido eliminada definitivamente.
    </p>
    <p style="color: #555; line-height: 1.6; font-size: 15px;">
      Si deseas volver a usar LOOKITRY, puedes crear una nueva cuenta en cualquier momento.
    </p>
  `;
  return baseTemplate(content);
};
