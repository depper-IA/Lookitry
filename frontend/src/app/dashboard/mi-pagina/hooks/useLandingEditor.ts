'use client';

import { useState, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LandingEditorState {
  // Brand Identity
  logoUrl: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  landingFont: string;
  showBrandName: boolean;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  widgetBgColor: string;
  coverBgColor: string;
  coverOverlayOpacity: number;
  headerColor: string;
  // Hero
  coverImageUrl: string;
  // Content
  description: string;
  slogan: string;
  ctaButtonText: string;
  // Social
  whatsapp: string;
  whatsappMessage: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  x: string;
  cityDisplay: string;
  nationalShipping: boolean;
  // Reviews
  rating: string;
  totalReviews: string;
  // Schedule
  schedule: Record<string, string>;
}

export interface LandingEditorActions {
  updateField: <K extends keyof LandingEditorState>(key: K, value: LandingEditorState[K]) => void;
  updateSchedule: (schedule: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  resetToDefaults: () => void;
  getBrandPayload: () => Partial<LandingEditorState>;
}

export type UseLandingEditorReturn = [LandingEditorState, LandingEditorActions];

const DEFAULT_STATE: LandingEditorState = {
  // Brand Identity
  logoUrl: '',
  logoLightUrl: '',
  logoDarkUrl: '',
  landingFont: 'font-jakarta',
  showBrandName: true,
  // Colors
  primaryColor: '#FF5C3A',
  secondaryColor: '#FF5C3A',
  widgetBgColor: '#0a0a0a',
  coverBgColor: '',
  coverOverlayOpacity: 0.55,
  headerColor: '',
  // Hero
  coverImageUrl: '',
  // Content
  description: '',
  slogan: '',
  ctaButtonText: 'Pruébalo ahora',
  // Social
  whatsapp: '',
  whatsappMessage: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  youtube: '',
  x: '',
  cityDisplay: '',
  nationalShipping: false,
  // Reviews
  rating: '',
  totalReviews: '',
  // Schedule
  schedule: {},
};

export function useLandingEditor(initialOverrides?: Partial<LandingEditorState>): UseLandingEditorReturn {
  const [state, setState] = useState<LandingEditorState>(() => ({
    ...DEFAULT_STATE,
    ...initialOverrides,
  }));

  const updateField = useCallback(<K extends keyof LandingEditorState>(
    key: K,
    value: LandingEditorState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSchedule = useCallback((
    schedule: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => {
    setState(prev => ({
      ...prev,
      schedule: typeof schedule === 'function' ? schedule(prev.schedule) : schedule,
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const getBrandPayload = useCallback((): Partial<LandingEditorState> => {
    const {
      logoUrl, logoLightUrl, logoDarkUrl, landingFont, showBrandName,
      primaryColor, secondaryColor, widgetBgColor, coverBgColor,
      coverOverlayOpacity, headerColor, coverImageUrl,
      description, slogan, ctaButtonText, whatsapp, whatsappMessage,
      instagram, facebook, tiktok, youtube, x,
      cityDisplay, nationalShipping, rating, totalReviews, schedule
    } = state;

    return {
      logoUrl, logoLightUrl, logoDarkUrl, landingFont, showBrandName,
      primaryColor, secondaryColor, widgetBgColor, coverBgColor,
      coverOverlayOpacity, headerColor, coverImageUrl,
      description, slogan, ctaButtonText, whatsapp, whatsappMessage,
      instagram, facebook, tiktok, youtube, x,
      cityDisplay, nationalShipping, rating, totalReviews, schedule,
    };
  }, [state]);

  const actions = useMemo<LandingEditorActions>(() => ({
    updateField,
    updateSchedule,
    resetToDefaults,
    getBrandPayload,
  }), [updateField, updateSchedule, resetToDefaults, getBrandPayload]);

  return [state, actions];
}

// ─── Selector hook ─────────────────────────────────────────────────────────────
// Hook para derivar el brand object para el preview desde el estado
export function useLandingBrandPreview(
  state: LandingEditorState,
  brandSlug: string,
  brandName?: string
) {
  return useMemo(() => ({
    name: brandName || '',
    slug: brandSlug,
    landing_template: 'classic' as const,
    landing_font: state.landingFont,
    widget_bg_color: state.widgetBgColor,
    slogan: state.slogan,
    brand_description: state.description,
    header_color: state.headerColor,
    cover_bg_color: state.coverBgColor,
    cover_overlay_opacity: state.coverOverlayOpacity,
    logo: state.logoUrl,
    logo_light: state.logoLightUrl,
    logo_dark: state.logoDarkUrl,
    cover_image_url: state.coverImageUrl,
    whatsapp_contact: state.whatsapp,
    whatsapp_message: state.whatsappMessage,
    cta_button_text: state.ctaButtonText,
    social_links: {
      instagram: state.instagram,
      facebook: state.facebook,
      tiktok: state.tiktok,
      youtube: state.youtube,
      x: state.x,
      _landing_primary: state.primaryColor,
      _landing_secondary: state.secondaryColor,
    },
    city_display: state.cityDisplay,
    national_shipping: state.nationalShipping,
    show_brand_name: state.showBrandName,
    rating: state.rating ? parseFloat(state.rating) : null,
    total_reviews: state.totalReviews ? parseInt(state.totalReviews, 10) : null,
    schedule: state.schedule,
    primary_color: state.primaryColor,
    secondary_color: state.secondaryColor,
  }), [state, brandSlug, brandName]);
}
