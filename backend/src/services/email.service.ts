import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {}

  /**
   * Obtiene la dirección "from" configurada
   */
  private getFromAddress(): string {
    return process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pruebalo.com';
  }

  /**
   * Inicializa el transporter con la configuración actual
   * Se llama cada vez para asegurar que las variables de entorno estén cargadas
   */
  private getTransporter(): Transporter {
    if (!this.transporter) {
      // Validar que las credenciales existan
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Credenciales SMTP no configuradas. Configura SMTP_USER y SMTP_PASS en el archivo .env');
      }

      // Configurar transporter con variables de entorno
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Envía un email
   * @param options - Opciones del email (to, subject, html)
   * @returns Promise con el resultado del envío
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = this.getTransporter();
      const mailOptions = {
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente:', info.messageId);
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      throw new Error('Error al enviar email');
    }
  }

  /**
   * Verifica la conexión con el servidor SMTP
   * @returns Promise<boolean>
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al verificar conexión SMTP:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const emailService = new EmailService();
