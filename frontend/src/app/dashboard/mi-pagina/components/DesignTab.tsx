'use client';

import React from 'react';
import { DoubleBezel } from '@/components/ui/DoubleBezel';
import { BrandIdentitySection, ColorsSection, HeroSection, ContentSection, SocialSection, ScheduleSection } from './sections';

interface DesignTabProps {
  description: string; setDescription: (v: string) => void;
  slogan: string; setSlogan: (v: string) => void;
  whatsapp: string; setWhatsapp: (v: string) => void;
  whatsappMessage: string; setWhatsappMessage: (v: string) => void;
  ctaButtonText: string; setCtaButtonText: (v: string) => void;
  coverImageUrl: string; setCoverImageUrl: (v: string) => void;
  logoUrl: string; setLogoUrl: (v: string) => void;
  logoLightUrl: string; setLogoLightUrl: (v: string) => void;
  logoDarkUrl: string; setLogoDarkUrl: (v: string) => void;
  coverBgColor: string; setCoverBgColor: (v: string) => void;
  coverOverlayOpacity: number; setCoverOverlayOpacity: (v: number) => void;
  headerColor: string; setHeaderColor: (v: string) => void;
  instagram: string; setInstagram: (v: string) => void;
  facebook: string; setFacebook: (v: string) => void;
  tiktok: string; setTiktok: (v: string) => void;
  youtube: string; setYoutube: (v: string) => void;
  x: string; setX: (v: string) => void;
  cityDisplay: string; setCityDisplay: (v: string) => void;
  nationalShipping: boolean; setNationalShipping: (v: boolean) => void;
  showBrandName: boolean; setShowBrandName: (v: boolean) => void;
  primaryColor: string; setPrimaryColor: (v: string) => void;
  secondaryColor: string; setSecondaryColor: (v: string) => void;
  widgetBgColor: string; setWidgetBgColor: (v: string) => void;
  landingFont: string; setLandingFont: (v: string) => void;
  rating: string; setRating: (v: string) => void;
  totalReviews: string; setTotalReviews: (v: string) => void;
  schedule: Record<string, string>; setSchedule: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export function DesignTab(props: DesignTabProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-8 h-[calc(100vh-12rem)] w-full overflow-hidden">
      {/* Editor Panel */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-10">
        <DoubleBezel>
          <BrandIdentitySection
            logoUrl={props.logoUrl} setLogoUrl={props.setLogoUrl}
            logoLightUrl={props.logoLightUrl} setLogoLightUrl={props.setLogoLightUrl}
            logoDarkUrl={props.logoDarkUrl} setLogoDarkUrl={props.setLogoDarkUrl}
            landingFont={props.landingFont} setLandingFont={props.setLandingFont}
            showBrandName={props.showBrandName} setShowBrandName={props.setShowBrandName}
          />
        </DoubleBezel>

        <DoubleBezel>
          <ColorsSection
            primaryColor={props.primaryColor} setPrimaryColor={props.setPrimaryColor}
            secondaryColor={props.secondaryColor} setSecondaryColor={props.setSecondaryColor}
            widgetBgColor={props.widgetBgColor} setWidgetBgColor={props.setWidgetBgColor}
            coverBgColor={props.coverBgColor} setCoverBgColor={props.setCoverBgColor}
          />
        </DoubleBezel>

        <DoubleBezel>
          <HeroSection
            coverImageUrl={props.coverImageUrl} setCoverImageUrl={props.setCoverImageUrl}
            coverBgColor={props.coverBgColor} setCoverBgColor={props.setCoverBgColor}
            coverOverlayOpacity={props.coverOverlayOpacity} setCoverOverlayOpacity={props.setCoverOverlayOpacity}
          />
        </DoubleBezel>

        <DoubleBezel>
          <ContentSection
            description={props.description} setDescription={props.setDescription}
            slogan={props.slogan} setSlogan={props.setSlogan}
            ctaButtonText={props.ctaButtonText} setCtaButtonText={props.setCtaButtonText}
          />
        </DoubleBezel>

        <DoubleBezel>
          <SocialSection
            whatsapp={props.whatsapp} setWhatsapp={props.setWhatsapp}
            whatsappMessage={props.whatsappMessage} setWhatsappMessage={props.setWhatsappMessage}
            instagram={props.instagram} setInstagram={props.setInstagram}
            facebook={props.facebook} setFacebook={props.setFacebook}
            tiktok={props.tiktok} setTiktok={props.setTiktok}
            youtube={props.youtube} setYoutube={props.setYoutube}
            x={props.x} setX={props.setX}
            cityDisplay={props.cityDisplay} setCityDisplay={props.setCityDisplay}
            rating={props.rating} setRating={props.setRating}
            totalReviews={props.totalReviews} setTotalReviews={props.setTotalReviews}
            nationalShipping={props.nationalShipping} setNationalShipping={props.setNationalShipping}
          />
        </DoubleBezel>

        <DoubleBezel>
          <ScheduleSection
            schedule={props.schedule} setSchedule={props.setSchedule}
          />
        </DoubleBezel>
      </div>

      {/* Preview Panel */}
      <div className="xl:w-1/2 flex items-center justify-center p-4">
        <DoubleBezel className="w-full h-full flex items-center justify-center">
            <div className="text-[var(--text-muted)] font-black uppercase tracking-widest text-sm opacity-50">Vista Previa</div>
        </DoubleBezel>
      </div>
    </div>
  );
}
