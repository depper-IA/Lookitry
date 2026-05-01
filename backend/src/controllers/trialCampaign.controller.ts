import { Request, Response } from 'express';

import { sanitizeError } from '../utils/sanitizeError';

import { supabaseAdmin } from '../config/supabase';



/**

 * Gestion de campanas de trial.

 *

 * Una campana activa define los dias, precio y condiciones del trial.

 * Si el precio es mayor a cero, el trial se activa via pago por prueba.

 *

 * Además se registra IP + fingerprint para evitar abuso de múltiples trials.

 */



// — Helpers —————————————————————————————————â



async function getActiveCampaign() {

  const now = new Date().toISOString();

  const { data } = await supabaseAdmin

    .from('trial_campaigns')

    .select('*')

    .eq('active', true)

    .or(`ends_at.is.null,ends_at.gt.${now}`)

    .order('created_at', { ascending: false })

    .limit(1)

    .single();

  return data;

}



// — Admin endpoints —————————————————————————————â



/**

 * GET /api/admin/trial-campaign

 * Obtener estado actual de la campaña de trial

 */

export const getTrialCampaign = async (_req: any, res: Response) => {

  try {

    const { data: campaigns, error } = await supabaseAdmin

      .from('trial_campaigns')

      .select('*')

      .order('created_at', { ascending: false })

      .limit(10);



    if (error) throw error;



    const active = await getActiveCampaign();



    return res.json({ campaigns: campaigns ?? [], activeCampaign: active ?? null });

  } catch (err: any) {

    console.error('[TrialCampaign] getTrialCampaign:', err);

    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener campañas') });

  }

};



/**

 * POST /api/admin/trial-campaign

 * Crear y activar una nueva campaña de trial

 */

export const createTrialCampaign = async (req: any, res: Response) => {

  try {

    const { name, trial_days = 7, trial_generations_limit = 15, price_cop = 20000, ends_at, require_card_verification = true } = req.body;



    if (!name || typeof name !== 'string' || name.trim().length === 0) {

      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre de la campaña es requerido' });

    }



    const trialDays = Math.min(90, Math.max(1, Number(trial_days) || 7));

    const trialGenerations = Math.min(500, Math.max(1, Number(trial_generations_limit) || 50));



    // Desactivar campañas anteriores

    await supabaseAdmin.from('trial_campaigns').update({ active: false }).eq('active', true);



    // Crear nueva campaña activa

    const { data, error } = await supabaseAdmin

      .from('trial_campaigns')

      .insert({

        name: name.trim(),

        active: true,

        trial_days: trialDays,

        trial_generations_limit: trialGenerations,

        price_cop: Number(price_cop) || 0,

        ends_at: ends_at || null,

        require_card_verification: require_card_verification !== false,

        created_by: req.admin?.email ?? 'admin',

      })

      .select()

      .single();



    if (error) throw error;



    return res.status(201).json({ message: 'Campaña creada y activada', campaign: data });

  } catch (err: any) {

    console.error('[TrialCampaign] createTrialCampaign:', err);

    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener campañas') });

  }

};



/**

 * PATCH /api/admin/trial-campaign/:id

 * Activar, desactivar o actualizar una campaña

 */

export const updateTrialCampaign = async (req: any, res: Response) => {

  try {

    const { id } = req.params;

    const { active, name, trial_days, ends_at, price_cop } = req.body;



    const updates: Record<string, any> = {};



    if (typeof active === 'boolean') {

      if (active) {

        // Desactivar otras antes de activar esta

        await supabaseAdmin.from('trial_campaigns').update({ active: false }).eq('active', true);

      }

      updates.active = active;

    }

    if (name !== undefined) updates.name = name;

    if (trial_days !== undefined) updates.trial_days = Math.min(90, Math.max(1, Number(trial_days)));

    if (ends_at !== undefined) updates.ends_at = ends_at || null;

    if (price_cop !== undefined) updates.price_cop = Number(price_cop) || 0;

    if (typeof req.body.require_card_verification === 'boolean') {

      updates.require_card_verification = req.body.require_card_verification;

    }

    if (req.body.trial_generations_limit !== undefined) {

      updates.trial_generations_limit = Math.min(500, Math.max(1, Number(req.body.trial_generations_limit) || 50));

    }



    if (Object.keys(updates).length === 0) {

      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nada que actualizar' });

    }



    const { data, error } = await supabaseAdmin

      .from('trial_campaigns')

      .update(updates)

      .eq('id', id)

      .select()

      .single();



    if (error) throw error;



    return res.json({ message: 'Campaña actualizada', campaign: data });

  } catch (err: any) {

    console.error('[TrialCampaign] updateTrialCampaign:', err);

    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener campañas') });

  }

};



// — Endpoint público —————————————————————————————



/**

 * GET /api/trial/status

 * Consulta pública: ¿hay una campaña de trial activa ahora mismo?

 */

export const getTrialStatus = async (_req: Request, res: Response) => {

  try {

    const campaign = await getActiveCampaign();



    return res.json({

      active: !!campaign,

      trialAvailable: !!campaign,

      trialDays: campaign?.trial_days ?? 0,

      priceCOP: campaign?.price_cop ?? 0,

      campaignName: campaign?.name ?? null,

      endsAt: campaign?.ends_at ?? null,

      requiresTrialPayment: Number(campaign?.price_cop ?? 0) > 0 && campaign?.require_card_verification !== false,

    });

  } catch (err: any) {

    console.error('[TrialCampaign] getTrialStatus:', err);

    return res.json({

      active: false,

      trialAvailable: false,

      trialDays: 0,

      campaignName: null,

      endsAt: null,

      requiresTrialPayment: false,

    });

  }

};

