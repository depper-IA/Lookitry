'use client';

import React from 'react';
import { DoubleBezel } from '@/components/ui/DoubleBezel';
import { BrandIdentitySection, ColorsSection, HeroSection, ContentSection, SocialSection, ScheduleSection } from './sections';
import { DeviceMockup } from './DeviceMockup';
import type { LandingEditorState, LandingEditorActions, UseLandingEditorReturn } from '../hooks/useLandingEditor';
import { useLandingBrandPreview } from '../hooks/useLandingEditor';

interface DesignTabProps {
  editor: UseLandingEditorReturn;
  brandSlug: string;
  brandName?: string;
  products?: unknown[];
}

export function DesignTab({ editor, brandSlug, brandName, products = [] }: DesignTabProps) {
  const [state, actions] = editor;
  const brandPreview = useLandingBrandPreview(state, brandSlug, brandName);

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-[calc(100vh-12rem)] w-full overflow-hidden">
      {/* Editor Panel */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-10">
        <DoubleBezel>
          <BrandIdentitySection
            state={{
              logoUrl: state.logoUrl,
              logoLightUrl: state.logoLightUrl,
              logoDarkUrl: state.logoDarkUrl,
              landingFont: state.landingFont,
              showBrandName: state.showBrandName,
            }}
            actions={actions}
          />
        </DoubleBezel>

        <DoubleBezel>
          <ColorsSection
            state={{
              primaryColor: state.primaryColor,
              secondaryColor: state.secondaryColor,
              widgetBgColor: state.widgetBgColor,
              coverBgColor: state.coverBgColor,
            }}
            actions={actions}
          />
        </DoubleBezel>

        <DoubleBezel>
          <HeroSection
            state={{
              coverImageUrl: state.coverImageUrl,
              coverBgColor: state.coverBgColor,
              coverOverlayOpacity: state.coverOverlayOpacity,
            }}
            actions={actions}
          />
        </DoubleBezel>

        <DoubleBezel>
          <ContentSection
            state={{
              description: state.description,
              slogan: state.slogan,
              ctaButtonText: state.ctaButtonText,
            }}
            actions={actions}
          />
        </DoubleBezel>

        <DoubleBezel>
          <SocialSection
            state={{
              whatsapp: state.whatsapp,
              whatsappMessage: state.whatsappMessage,
              instagram: state.instagram,
              facebook: state.facebook,
              tiktok: state.tiktok,
              youtube: state.youtube,
              x: state.x,
              cityDisplay: state.cityDisplay,
              rating: state.rating,
              totalReviews: state.totalReviews,
              nationalShipping: state.nationalShipping,
            }}
            actions={actions}
          />
        </DoubleBezel>

        <DoubleBezel>
          <ScheduleSection
            state={{ schedule: state.schedule }}
            actions={actions}
          />
        </DoubleBezel>
      </div>

      {/* Preview Panel - Device Mockup */}
      <div className="xl:w-1/2 flex items-center justify-center p-4">
        <DoubleBezel className="w-full h-full flex items-center justify-center">
          <DeviceMockup
            brandSlug={brandSlug}
            brand={brandPreview}
            products={products}
          />
        </DoubleBezel>
      </div>
    </div>
  );
}
