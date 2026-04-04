import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

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
      .select('id, referred_brand_id, status, created_at, referrer_claimed, referred_claimed')
      .eq('referrer_brand_id', brandId)
      .order('created_at', { ascending: false });

    return res.status(200).json({
      referralCode,
      referralCount: referrals?.length || 0,
      successfulReferrals: referrals?.filter(r => r.status === 'converted').length || 0,
      pendingReferrals: referrals?.filter(r => r.status === 'pending').length || 0,
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
      return res.status(400).json({ error: 'Código requerido' });
    }

    const upperCode = code.toUpperCase().trim();

    const { data: referrer } = await supabaseAdmin
      .from('brands')
      .select('id, name, referral_count')
      .eq('referral_code', upperCode)
      .single();

    if (!referrer) {
      return res.status(404).json({ error: 'Código de referido inválido' });
    }

    const brandId = req.brand?.id;
    if (brandId === referrer.id) {
      return res.status(400).json({ error: 'No puedes usar tu propio código' });
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
      return res.status(400).json({ error: 'Código requerido' });
    }

    const upperCode = code.toUpperCase().trim();

    const { data: referrer } = await supabaseAdmin
      .from('brands')
      .select('id, name, referral_count')
      .eq('referral_code', upperCode)
      .single();

    if (!referrer) {
      return res.status(404).json({ error: 'Código de referido inválido' });
    }

    if (referrer.id === brandId) {
      return res.status(400).json({ error: 'No puedes usar tu propio código' });
    }

    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_brand_id', brandId)
      .single();

    if (existingReferral) {
      return res.status(400).json({ error: 'Ya tienes un referido registrado' });
    }

    const { data: newReferral } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_brand_id: referrer.id,
        referred_brand_id: brandId,
        referral_code: upperCode,
        bonus_months: 1,
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
      message: 'Código aplicado. ¡1 mes gratis disponible cuando tu referred complete su primer pago!',
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
        bonus_credited,
        referrer_claimed,
        referred_claimed,
        status,
        created_at,
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
      return res.status(400).json({ error: ' referralId y target requeridos' });
    }

    if (!['referrer', 'referred'].includes(target)) {
      return res.status(400).json({ error: 'Target debe ser referrer o referred' });
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

    const updateField = target === 'referrer' ? 'referrer_claimed' : 'referred_claimed';
    const dateField = target === 'referrer' ? 'referrer_claimed_at' : 'referred_claimed_at';

    if (referral[updateField]) {
      return res.status(400).json({ error: 'Bonus ya acreditado' });
    }

    await supabaseAdmin
      .from('referrals')
      .update({
        [updateField]: true,
        [dateField]: new Date().toISOString(),
        bonus_credited: true,
        bonus_credited_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    const brandId = target === 'referrer' ? referral.referrer_brand_id : referral.referred_brand_id;
    const months = referral.bonus_months || 1;

    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('subscription_end_date, plan')
      .eq('id', brandId)
      .single();

    let newEndDate: Date;
    if (brand?.subscription_end_date && new Date(brand.subscription_end_date) > new Date()) {
      newEndDate = new Date(brand.subscription_end_date);
      newEndDate.setMonth(newEndDate.getMonth() + months);
    } else {
      newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + months);
    }

    await supabaseAdmin
      .from('brands')
      .update({ subscription_end_date: newEndDate.toISOString() })
      .eq('id', brandId);

    return res.status(200).json({
      success: true,
      message: `Bonus de ${months} mes(es) acreditado`,
    });
  } catch (error) {
    console.error('Error crediting referral bonus:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}