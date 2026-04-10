import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  /**
   * Crea un transporter fresco en cada llamada para garantizar que las
   * variables de entorno estén cargadas y que un fallo previo no bloquee
   * los envíos siguientes.
   */
  private createTransporter(): Transporter {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Credenciales SMTP no configuradas. Configura SMTP_USER y SMTP_PASS en el archivo .env');
    }

    const port = parseInt(process.env.SMTP_PORT || '465');
    // Puerto 465 siempre usa SSL (secure=true). Otros puertos usan STARTTLS (secure=false).
    const secure = port === 465 ? true : process.env.SMTP_SECURE === 'true';

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Timeout generoso para evitar cuelgues silenciosos
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  private getFromAddress(): string {
    return process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pruebalo.com';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const transporter = this.createTransporter();
    try {
      const info = await transporter.sendMail({
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log('[Email] Enviado:', info.messageId, '→', options.to);
    } catch (error: any) {
      console.error('[Email] Error al enviar a', options.to, ':', error?.message || error);
      throw new Error('Error al enviar email: ' + (error?.message || 'desconocido'));
    } finally {
      transporter.close();
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      transporter.close();
      console.log('[Email] Conexión SMTP verificada correctamente');
      return true;
    } catch (error: any) {
      console.error('[Email] Error al verificar conexión SMTP:', error?.message || error);
      return false;
    }
  }
}

export const emailService = new EmailService();
