import { referralService } from '../referral.service';
import { supabaseAdmin } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

function buildChain(resolvedValue: any) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
    maybeSingle: jest.fn().mockResolvedValue(resolvedValue),
  };
}

describe('ReferralService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignora planes no elegibles', async () => {
    const result = await referralService.convertReferralForFirstPaidPlan({
      referredBrandId: 'brand-1',
      planPurchased: 'TRIAL',
      paymentReference: 'PTRIAL-1',
    });

    expect(result).toEqual({ converted: false, rewarded: false, rewardCredits: 0 });
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it('convierte un referral pendiente y acredita 500 creditos una sola vez', async () => {
    const pendingReferral = {
      id: 'ref-1',
      referrer_brand_id: 'referrer-1',
      referred_brand_id: 'brand-1',
      referral_code: 'ABCD1234',
      reward_credits: 500,
      referrer_claimed: false,
      status: 'pending',
    };
    const convertedReferral = { ...pendingReferral, status: 'converted' };
    const claimedReferral = { referrer_brand_id: 'referrer-1', reward_credits: 500 };

    const referralsFetch = buildChain({ data: pendingReferral, error: null });
    const referralsConvert = buildChain({ data: convertedReferral, error: null });
    const referralsClaimFetch = buildChain({ data: convertedReferral, error: null });
    const referralsClaimUpdate = buildChain({ data: claimedReferral, error: null });
    const brandBalanceFetch = buildChain({ data: { extra_credits_balance: 100 }, error: null });
    const brandBalanceUpdate = buildChain({ data: { extra_credits_balance: 600 }, error: null });

    (supabaseAdmin.from as jest.Mock)
      .mockReturnValueOnce(referralsFetch)
      .mockReturnValueOnce(referralsConvert)
      .mockReturnValueOnce(referralsClaimFetch)
      .mockReturnValueOnce(referralsClaimUpdate)
      .mockReturnValueOnce(brandBalanceFetch)
      .mockReturnValueOnce(brandBalanceUpdate);

    const result = await referralService.convertReferralForFirstPaidPlan({
      referredBrandId: 'brand-1',
      planPurchased: 'BASIC',
      paymentReference: 'PAY-brand-1-1',
    });

    expect(result).toEqual({
      converted: true,
      rewarded: true,
      rewardCredits: 500,
      referralId: 'ref-1',
    });
    expect(brandBalanceUpdate.update).toHaveBeenCalledWith({ extra_credits_balance: 600 });
  });

  it('no duplica creditos si el referral ya estaba acreditado', async () => {
    const convertedReferral = {
      id: 'ref-1',
      referrer_brand_id: 'referrer-1',
      referred_brand_id: 'brand-1',
      referral_code: 'ABCD1234',
      reward_credits: 500,
      referrer_claimed: true,
      status: 'converted',
    };

    const referralsFetch = buildChain({ data: convertedReferral, error: null });
    const referralsClaimFetch = buildChain({ data: convertedReferral, error: null });

    (supabaseAdmin.from as jest.Mock)
      .mockReturnValueOnce(referralsFetch)
      .mockReturnValueOnce(referralsClaimFetch);

    const result = await referralService.convertReferralForFirstPaidPlan({
      referredBrandId: 'brand-1',
      planPurchased: 'PRO',
      paymentReference: 'PAY-brand-1-2',
    });

    expect(result).toEqual({
      converted: true,
      rewarded: false,
      rewardCredits: 500,
      referralId: 'ref-1',
    });
  });
});
