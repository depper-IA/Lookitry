import { supabaseAdmin } from '../config/supabase';

const DEFAULT_REFERRAL_REWARD_CREDITS = 200;
const DEFAULT_REFERRED_REWARD_CREDITS = 100;
const ELIGIBLE_REFERRAL_PLANS = ['BASIC', 'PRO', 'ENTERPRISE'] as const;

type ReferralRow = {
  id: string;
  referrer_brand_id: string;
  referred_brand_id: string;
  referral_code: string;
  reward_credits?: number | null;
  referrer_claimed?: boolean | null;
  status: 'pending' | 'converted';
};

export class ReferralService {
  getDefaultRewardCredits(): number {
    return DEFAULT_REFERRAL_REWARD_CREDITS;
  }

  getDefaultReferredRewardCredits(): number {
    return DEFAULT_REFERRED_REWARD_CREDITS;
  }

  isEligiblePlan(plan?: string | null): boolean {
    return ELIGIBLE_REFERRAL_PLANS.includes(String(plan || '').toUpperCase() as (typeof ELIGIBLE_REFERRAL_PLANS)[number]);
  }

  async convertReferralForFirstPaidPlan(params: {
    referredBrandId: string;
    planPurchased?: string | null;
    paymentReference?: string | null;
  }): Promise<{ converted: boolean; rewarded: boolean; rewardedReferred: boolean; rewardCredits: number; referralId?: string }> {
    const { referredBrandId, planPurchased, paymentReference } = params;

    if (!referredBrandId || !this.isEligiblePlan(planPurchased)) {
      return { converted: false, rewarded: false, rewardedReferred: false, rewardCredits: 0 };
    }

    const { data: existingReferral, error: fetchError } = await supabaseAdmin
      .from('referrals')
      .select('id, referrer_brand_id, referred_brand_id, referral_code, reward_credits, referrer_claimed, status')
      .eq('referred_brand_id', referredBrandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !existingReferral) {
      return { converted: false, rewarded: false, rewardedReferred: false, rewardCredits: 0 };
    }

    const referral = existingReferral as ReferralRow;
    const rewardCredits = Number(referral.reward_credits || DEFAULT_REFERRAL_REWARD_CREDITS);

    let convertedReferral = referral;
    if (referral.status !== 'converted') {
      const { data: updatedReferral } = await supabaseAdmin
        .from('referrals')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          conversion_payment_reference: paymentReference || null,
        })
        .eq('id', referral.id)
        .eq('status', 'pending')
        .select('id, referrer_brand_id, referred_brand_id, referral_code, reward_credits, referrer_claimed, status')
        .maybeSingle();

      if (updatedReferral) {
        convertedReferral = updatedReferral as ReferralRow;
      } else {
        const { data: refreshedReferral } = await supabaseAdmin
          .from('referrals')
          .select('id, referrer_brand_id, referred_brand_id, referral_code, reward_credits, referrer_claimed, status')
          .eq('id', referral.id)
          .maybeSingle();

        if (!refreshedReferral) {
          return { converted: false, rewarded: false, rewardedReferred: false, rewardCredits: 0 };
        }

        convertedReferral = refreshedReferral as ReferralRow;
      }
    }

    const rewarded = await this.creditReferrer(convertedReferral.id);
    const rewardedReferred = await this.creditReferred(convertedReferral.id);
    return {
      converted: convertedReferral.status === 'converted',
      rewarded,
      rewardedReferred,
      rewardCredits,
      referralId: convertedReferral.id,
    };
  }

  async creditReferrer(referralId: string): Promise<boolean> {
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('id, referrer_brand_id, reward_credits, referrer_claimed')
      .eq('id', referralId)
      .maybeSingle();

    if (!referral) {
      return false;
    }

    if (referral.referrer_claimed) {
      return false;
    }

    const { data: claimedReferral } = await supabaseAdmin
      .from('referrals')
      .update({
        referrer_claimed: true,
        referrer_claimed_at: new Date().toISOString(),
        bonus_credited: true,
        bonus_credited_at: new Date().toISOString(),
      })
      .eq('id', referralId)
      .eq('referrer_claimed', false)
      .select('referrer_brand_id, reward_credits')
      .maybeSingle();

    if (!claimedReferral) {
      return false;
    }

    const rewardCredits = Number(claimedReferral.reward_credits || DEFAULT_REFERRAL_REWARD_CREDITS);
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('extra_credits_balance')
      .eq('id', claimedReferral.referrer_brand_id)
      .single();

    const newBalance = Number(brand?.extra_credits_balance || 0) + rewardCredits;
    await supabaseAdmin
      .from('brands')
      .update({ extra_credits_balance: newBalance })
      .eq('id', claimedReferral.referrer_brand_id);

    return true;
  }

  async creditReferred(referralId: string): Promise<boolean> {
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('id, referred_brand_id, reward_credits, referred_claimed')
      .eq('id', referralId)
      .maybeSingle();

    if (!referral) {
      return false;
    }

    if (referral.referred_claimed) {
      return false;
    }

    const { data: claimedReferral } = await supabaseAdmin
      .from('referrals')
      .update({
        referred_claimed: true,
        referred_claimed_at: new Date().toISOString(),
      })
      .eq('id', referralId)
      .eq('referred_claimed', false)
      .select('referred_brand_id, reward_credits')
      .maybeSingle();

    if (!claimedReferral) {
      return false;
    }

    const referredRewardCredits = DEFAULT_REFERRED_REWARD_CREDITS;

    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('extra_credits_balance')
      .eq('id', claimedReferral.referred_brand_id)
      .single();

    const newBalance = Number(brand?.extra_credits_balance || 0) + referredRewardCredits;
    await supabaseAdmin
      .from('brands')
      .update({ extra_credits_balance: newBalance })
      .eq('id', claimedReferral.referred_brand_id);

    return true;
  }
}

export const referralService = new ReferralService();
