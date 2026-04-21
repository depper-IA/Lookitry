import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { referralService } from '../services/referral.service';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getReferralInfo(req: AuthRequest, res: Response) {
  try {
    const brandId = req.brand?.id;
    if (!brandId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('referral_code, referral_count')
      .eq('id', brandId)
      .single();

    let referralCode = brand?.referral_code;
    if (!referralCode) {
      referralCode = generateReferralCode();
      await supabaseAdmin
        .from('brands')
        .update({ referral_code: referralCode })
        .eq('id', brandId);
    }

    const { data: referrals } = await supabaseAdmin
      .from('referrals')
      .select('id, referred_brand_id, status, created_at, referrer_claimed, reward_credits, converted_at')
      .eq('referrer_brand_id', brandId)
      .order('created_at', { ascending: false });

    const rewardCredits = referralService.getDefaultRewardCredits();
    const referredRewardCredits = referralService.getDefaultReferredRewardCredits();
    const totalCreditsEarned = (referrals || [])
      .filter(referral => referral.referrer_claimed)
      .reduce((sum, referral) => sum + Number(referral.reward_credits || rewardCredits), 0);

    // Check if current user has a referral code applied (they are the referred)
    const { data: myReferralAsReferred } = await supabaseAdmin
      .from('referrals')
      .select('id, status, referrer_claimed, referred_claimed, referrer:brands!referrer_brand_id(name)')
      .eq('referred_brand_id', brandId)
      .maybeSingle();

    return res.status(200).json({
      referralCode,
      rewardCredits,
      referredRewardCredits,
      referralCount: referrals?.length || 0,
      successfulReferrals: referrals?.filter(r => r.status === 'converted').length || 0,
      pendingReferrals: referrals?.filter(r => r.status === 'pending').length || 0,
      totalCreditsEarned,
      hasReferredCode: !!myReferralAsReferred,
      referredCodeStatus: myReferralAsReferred?.status || null,
      referrerName: myReferralAsReferred?.referrer?.[0]?.name || null,
      recentReferrals: referrals?.slice(0, 5) || [],
    });
  } catch (error) {
    console.error('Error getting referral info:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

export async function validateReferralCode(req: AuthRequest, res: Response) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Codigo requerido' });
    }

    const upperCode = code.toUpperCase().trim();

    const { data: referrer } = await supabaseAdmin
      .from('brands')
      .select('id, name, referral_count')
      .eq('referral_code', upperCode)
      .single();

    if (!referrer) {
      return res.status(404).json({ error: 'Codigo de referido invalido' });
    }

    const brandId = req.brand?.id;
    if (brandId === referrer.id) {
      return res.status(400).json({ error: 'No puedes usar tu propio codigo' });
    }

    return res.status(200).json({
      valid: true,
      referrerName: referrer.name,
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

export async function claimReferralBonus(req: AuthRequest, res: Response) {
  try {
    const brandId = req.brand?.id;
    if (!brandId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Codigo requerido' });
    }

    const upperCode = code.toUpperCase().trim();

    const { data: referrer } = await supabaseAdmin
      .from('brands')
      .select('id, name, referral_count')
      .eq('referral_code', upperCode)
      .single();

    if (!referrer) {
      return res.status(404).json({ error: 'Codigo de referido invalido' });
    }

    if (referrer.id === brandId) {
      return res.status(400).json({ error: 'No puedes usar tu propio codigo' });
    }

    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_brand_id', brandId)
      .maybeSingle();

    if (existingReferral) {
      return res.status(400).json({ error: 'Ya tienes un referido registrado' });
    }

    const rewardCredits = referralService.getDefaultRewardCredits();
    const { data: newReferral } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_brand_id: referrer.id,
        referred_brand_id: brandId,
        referral_code: upperCode,
        bonus_months: 1,
        reward_credits: rewardCredits,
        status: 'pending',
      })
      .select()
      .single();

    await supabaseAdmin
      .from('brands')
      .update({ referral_count: (referrer.referral_count || 0) + 1 })
      .eq('id', referrer.id);

    return res.status(200).json({
      success: true,
      message: `Codigo aplicado. Tu referente recibira ${rewardCredits} creditos extra cuando completes tu primer pago de suscripcion.`,
      referralId: newReferral?.id,
    });
  } catch (error) {
    console.error('Error claiming referral bonus:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

export async function getAdminReferrals(req: AuthRequest, res: Response) {
  try {
    const { data: referrals } = await supabaseAdmin
      .from('referrals')
      .select(`
        id,
        referral_code,
        bonus_months,
        reward_credits,
        bonus_credited,
        referrer_claimed,
        referred_claimed,
        status,
        created_at,
        converted_at,
        conversion_payment_reference,
        referrer_claimed_at,
        referred_claimed_at,
        referrer:brands!referrer_brand_id(id, name, email, slug),
        referred:brands!referred_brand_id(id, name, email, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    return res.status(200).json({ referrals: referrals || [] });
  } catch (error) {
    console.error('Error getting admin referrals:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

export async function creditReferralBonus(req: AuthRequest, res: Response) {
  try {
    const { referralId } = req.params;
    const { target } = req.body;

    if (!referralId || !target) {
      return res.status(400).json({ error: 'referralId y target requeridos' });
    }

    if (target !== 'referrer') {
      return res.status(400).json({ error: 'Solo se permite acreditar al referente' });
    }

    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (!referral) {
      return res.status(404).json({ error: 'Referral no encontrado' });
    }

    if (referral.status !== 'converted') {
      return res.status(400).json({ error: 'El referral debe estar convertido para aplicar bonus' });
    }

    if (referral.referrer_claimed) {
      return res.status(400).json({ error: 'Bonus ya acreditado' });
    }

    const credited = await referralService.creditReferrer(referralId);
    if (!credited) {
      return res.status(400).json({ error: 'No se pudo acreditar el bonus o ya fue aplicado' });
    }

    const rewardCredits = Number(referral.reward_credits || referralService.getDefaultRewardCredits());
    return res.status(200).json({
      success: true,
      message: `Bonus de ${rewardCredits} creditos acreditado al referente`,
    });
  } catch (error) {
    console.error('Error crediting referral bonus:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
