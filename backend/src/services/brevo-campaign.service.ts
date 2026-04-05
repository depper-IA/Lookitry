import https from 'https';

export interface BrevoEmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}

export interface BrevoSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface BrevoMessageStatus {
  email: string;
  messageId: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'blocked';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

export class BrevoCampaignService {
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.SMTP_FROM || 'info@lookitry.com';
    this.senderName = process.env.SMTP_FROM_NAME || 'Lookitry';
  }

  private async makeRequest(path: string, method: string, body?: object): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: `/v3${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  async sendEmail(options: BrevoEmailOptions): Promise<BrevoSendResult> {
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY no configurada');
    }

    const payload = {
      sender: {
        name: options.fromName || this.senderName,
        email: this.senderEmail,
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    };

    const result = await this.makeRequest('/smtp/email', 'POST', payload);

    return {
      messageId: result.messageId || result['message-id'] || '',
      accepted: result.to || [options.to],
      rejected: result.rejected || [],
    };
  }

  async sendBatchEmails(
    emails: Array<{ to: string; subject: string; html: string; fromName?: string }>
  ): Promise<{ successful: number; failed: number; results: BrevoSendResult[] }> {
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY no configurada');
    }

    const payload = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: emails.map((e) => ({ email: e.to })),
      subject: emails[0]?.subject || 'Email de Lookitry',
      htmlContent: emails[0]?.html || '',
    };

    try {
      const result = await this.makeRequest('/smtp/email', 'POST', payload);
      return {
        successful: emails.length,
        failed: 0,
        results: [
          {
            messageId: result.messageId || result['message-id'] || '',
            accepted: result.to || emails.map((e) => e.to),
            rejected: result.rejected || [],
          },
        ],
      };
    } catch (error: any) {
      console.error('[Brevo] Error sending batch:', error);
      return {
        successful: 0,
        failed: emails.length,
        results: [],
      };
    }
  }

  async getEmailStatus(messageId: string): Promise<BrevoMessageStatus | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const result = await this.makeRequest(`/smtp/emails/${messageId}/details`, 'GET');
      return {
        email: result.email || '',
        messageId,
        status: this.mapBrevoStatus(result.status),
        sentAt: result.date,
        deliveredAt: result.deliveredAt,
        openedAt: result.openedAt,
        clickedAt: result.clickedAt,
      };
    } catch (error) {
      console.error('[Brevo] Error getting email status:', error);
      return null;
    }
  }

  private mapBrevoStatus(status: string): BrevoMessageStatus['status'] {
    const statusMap: Record<string, BrevoMessageStatus['status']> = {
      sent: 'sent',
      delivered: 'delivered',
      opened: 'opened',
      clicked: 'clicked',
      bounced: 'bounced',
      blocked: 'blocked',
    };
    return statusMap[status?.toLowerCase()] || 'sent';
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      await this.makeRequest('/smtp/email', 'POST', {
        sender: { name: 'Test', email: this.senderEmail },
        to: [{ email: this.senderEmail }],
        subject: 'Test Connection',
        htmlContent: '<p>Test</p>',
      });
      return true;
    } catch (error) {
      console.error('[Brevo] Connection verification failed:', error);
      return false;
    }
  }
}

export const brevoCampaignService = new BrevoCampaignService();
