import { supabaseAdmin } from '../config/supabase';
import { brevoCampaignService, BrevoSendResult } from './brevo-campaign.service';

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 10 * 60 * 1000;
const MAX_DAILY_EMAILS = 300;
const DAILY_RESET_HOUR = 0;

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  html_template: string;
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  filter_type: 'all' | 'trial' | 'paid' | 'plan';
  filter_plan?: string;
  filter_created_after?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaignRecipient {
  id: string;
  campaign_id: string;
  brand_id: string;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked';
  message_id: string | null;
  sent_at: string | null;
  error: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

export interface CampaignStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
}

export class EmailCampaignService {
  private dailySentCount: number = 0;
  private lastResetDate: string = '';

  private async getDailySentCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.lastResetDate = today;
      this.dailySentCount = 0;
    }
    return this.dailySentCount;
  }

  private async incrementDailyCount(count: number): Promise<void> {
    this.dailySentCount += count;
  }

  async canSendMore(): Promise<boolean> {
    const sent = await this.getDailySentCount();
    return sent < MAX_DAILY_EMAILS;
  }

  async getRemainingDailyQuota(): Promise<number> {
    const sent = await this.getDailySentCount();
    return Math.max(0, MAX_DAILY_EMAILS - sent);
  }

  async createCampaign(params: {
    name: string;
    subject: string;
    htmlTemplate: string;
    filterType?: 'all' | 'trial' | 'paid' | 'plan';
    filterPlan?: string;
    filterCreatedAfter?: string;
    createdBy: string;
  }): Promise<EmailCampaign> {
    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        name: params.name,
        subject: params.subject,
        html_template: params.htmlTemplate,
        filter_type: params.filterType || 'all',
        filter_plan: params.filterPlan,
        filter_created_after: params.filterCreatedAfter,
        status: 'draft',
        created_by: params.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapCampaignRow(data);
  }

  async getCampaigns(): Promise<EmailCampaign[]> {
    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(this.mapCampaignRow);
  }

  async getCampaignById(id: string): Promise<EmailCampaign | null> {
    const { data, error } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapCampaignRow(data) : null;
  }

  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const { data, error } = await supabaseAdmin
      .from('email_campaign_recipients')
      .select('status')
      .eq('campaign_id', campaignId);

    if (error) throw error;

    const stats: CampaignStats = { total: 0, pending: 0, sent: 0, failed: 0, opened: 0, clicked: 0 };
    for (const row of data || []) {
      stats.total++;
      const status = row.status as keyof CampaignStats;
      if (status in stats) {
        stats[status]++;
      }
    }
    return stats;
  }

  async scheduleCampaign(campaignId: string, scheduledAt: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt,
      })
      .eq('id', campaignId)
      .eq('status', 'draft');

    if (error) throw error;
  }

  async launchCampaignNow(campaignId: string): Promise<{ recipientsAdded: number }> {
    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) throw new Error('Campaña no encontrada');
    if (campaign.status !== 'draft') throw new Error('Solo campañas en draft pueden ejecutarse');

    await supabaseAdmin
      .from('email_campaigns')
      .update({ status: 'processing' })
      .eq('id', campaignId);

    const recipients = await this.buildRecipientList(campaign);
    await this.queueRecipients(campaignId, recipients);

    return { recipientsAdded: recipients.length };
  }

  async processScheduledCampaigns(): Promise<string[]> {
    const now = new Date().toISOString();
    const { data: campaigns } = await supabaseAdmin
      .from('email_campaigns')
      .select('id')
      .eq('status', 'scheduled')
      .or(`scheduled_at.is.null,scheduled_at.lt.${now}`)
      .limit(5);

    const processed: string[] = [];
    for (const c of campaigns || []) {
      await supabaseAdmin
        .from('email_campaigns')
        .update({ status: 'processing' })
        .eq('id', c.id);
      processed.push(c.id);
    }
    return processed;
  }

  async processNextBatch(campaignId: string): Promise<{ processed: number; remaining: number; completed: boolean }> {
    if (!(await this.canSendMore())) {
      return { processed: 0, remaining: 0, completed: false };
    }

    const remainingQuota = await this.getRemainingDailyQuota();
    const batchSize = Math.min(BATCH_SIZE, remainingQuota);

    const { data: recipients } = await supabaseAdmin
      .from('email_campaign_recipients')
      .select('id, email, brand_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('id', { ascending: true })
      .limit(batchSize);

    if (!recipients || recipients.length === 0) {
      const { data: pendingCount } = await supabaseAdmin
        .from('email_campaign_recipients')
        .select('id', { count: 'exact' })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

      const isComplete = (pendingCount?.length || 0) === 0;

      if (isComplete) {
        await supabaseAdmin
          .from('email_campaigns')
          .update({ status: 'completed' })
          .eq('id', campaignId);
      }

      return { processed: 0, remaining: pendingCount?.length || 0, completed: isComplete };
    }

    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) return { processed: 0, remaining: 0, completed: false };

    let processed = 0;
    for (const recipient of recipients) {
      try {
        const html = this.interpolateTemplate(campaign.html_template, recipient);
        const result = await brevoCampaignService.sendEmail({
          to: recipient.email,
          subject: campaign.subject,
          html,
        });

        await supabaseAdmin
          .from('email_campaign_recipients')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            message_id: result.messageId,
          })
          .eq('id', recipient.id);

        processed++;
        await this.incrementDailyCount(1);
      } catch (error: any) {
        await supabaseAdmin
          .from('email_campaign_recipients')
          .update({
            status: 'failed',
            error: error?.message || 'Error desconocido',
          })
          .eq('id', recipient.id);
      }

      if (processed % BATCH_SIZE === 0) {
        await this.delay(BATCH_DELAY_MS);
      }
    }

    const { data: stillPending } = await supabaseAdmin
      .from('email_campaign_recipients')
      .select('id', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    const remaining = stillPending?.length || 0;
    const isComplete = remaining === 0;

    if (isComplete) {
      await supabaseAdmin
        .from('email_campaigns')
        .update({ status: 'completed' })
        .eq('id', campaignId);
    }

    return { processed, remaining, completed: isComplete };
  }

  async previewCampaign(campaignId: string, sampleSize = 3): Promise<Array<{ email: string; html: string }>> {
    const campaign = await this.getCampaignById(campaignId);
    if (!campaign) throw new Error('Campaña no encontrada');

    const recipients = await this.buildRecipientList(campaign, sampleSize);
    return recipients.map((r) => ({
      email: r.email,
      html: this.interpolateTemplate(campaign.html_template, r),
    }));
  }

  async cancelCampaign(campaignId: string): Promise<void> {
    await supabaseAdmin
      .from('email_campaigns')
      .update({ status: 'cancelled' })
      .eq('id', campaignId)
      .in('status', ['draft', 'scheduled']);

    await supabaseAdmin
      .from('email_campaign_recipients')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await supabaseAdmin
      .from('email_campaign_recipients')
      .delete()
      .eq('campaign_id', campaignId);

    await supabaseAdmin
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);
  }

  private async buildRecipientList(
    campaign: EmailCampaign,
    limit?: number
  ): Promise<Array<{ brand_id: string; email: string; contact_name?: string; name?: string; plan?: string }>> {
    let query = supabaseAdmin
      .from('brands')
      .select('id, email, contact_name, name, plan')
      .eq('email_verified', true)
      .not('email', 'is', null);

    if (campaign.filter_type === 'trial') {
      query = query.eq('plan', 'TRIAL');
    } else if (campaign.filter_type === 'paid') {
      query = query.in('plan', ['BASIC', 'PRO', 'ENTERPRISE']);
    } else if (campaign.filter_type === 'plan' && campaign.filter_plan) {
      query = query.eq('plan', campaign.filter_plan);
    }

    if (campaign.filter_created_after) {
      query = query.gte('created_at', campaign.filter_created_after);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => ({
      brand_id: row.id,
      email: row.email,
      contact_name: row.contact_name,
      name: row.name,
      plan: row.plan,
    }));
  }

  private async queueRecipients(campaignId: string, recipients: Array<{ brand_id: string; email: string }>): Promise<void> {
    const inserts = recipients.map((r) => ({
      campaign_id: campaignId,
      brand_id: r.brand_id,
      email: r.email,
      status: 'pending' as const,
    }));

    await supabaseAdmin.from('email_campaign_recipients').insert(inserts);
  }

  private interpolateTemplate(
    template: string,
    recipient: { email: string; contact_name?: string; name?: string; plan?: string }
  ): string {
    const firstName = recipient.contact_name?.split(' ')[0] || recipient.name?.split(' ')[0] || 'Equipo';
    const brandName = recipient.name || 'Lookitry';

    return template
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{brandName\}\}/g, brandName)
      .replace(/\{\{email\}\}/g, recipient.email)
      .replace(/\{\{plan\}\}/g, recipient.plan || 'TRIAL');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapCampaignRow(row: any): EmailCampaign {
    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      html_template: row.html_template,
      status: row.status,
      scheduled_at: row.scheduled_at,
      filter_type: row.filter_type,
      filter_plan: row.filter_plan,
      filter_created_after: row.filter_created_after,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const emailCampaignService = new EmailCampaignService();
