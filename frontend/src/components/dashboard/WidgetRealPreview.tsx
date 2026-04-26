'use client';

import React, { useState } from 'react';
import type { WidgetTemplate, TryOnConfigResponse, Product } from '@/types';
import { TemplateBare } from '../tryon/templates/TemplateBare';
import { TemplateModernSidebar } from '../tryon/templates/TemplateModernSidebar';
import { TemplateBoldProStudio } from '../tryon/templates/TemplateBoldProStudio';
import { TemplateShowcase } from '../tryon/templates/TemplateShowcase';

interface WidgetRealPreviewProps {
  template: WidgetTemplate;
  primaryColor: string;
  secondaryColor: string;
  buttonText: string;
  welcomeMessage: string;
  brandName: string;
  brandLogo?: string;
  widgetCoverImage?: string | null;
  isPro: boolean;
  products: Product[];
}

export function WidgetRealPreview({
  template,
  primaryColor,
  secondaryColor,
  buttonText,
  welcomeMessage,
  brandName,
  brandLogo,
  widgetCoverImage,
  isPro,
  products
}: WidgetRealPreviewProps) {
  
  // Estado local para la selfie en el preview
  const [previewSelfie, setPreviewSelfie] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'select' | 'generating' | 'result'>('select');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Terms for preview - always accepted in preview mode
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Configuración de escalado para que el preview se vea EXACTO a un móvil real
  // El marco tiene 260px de ancho. Un móvil estándar tiene ~375px.
  // 260 / 375 = 0.6933 de escala.
  const SCALE = 260 / 375;
  const INTERNAL_WIDTH = 375;
  const INTERNAL_HEIGHT = 520 / SCALE; // Aprox 750px

  // Construir configuración mínima
  // Solo mostrar hasta 6 productos en el preview para que se vea bien
  const previewProducts = products.slice(0, 6);

  const config: TryOnConfigResponse = {
    brand: {
      id: 'preview',
      name: brandName,
      slug: 'preview',
      logo: brandLogo,
      primaryColor,
      secondaryColor,
      widgetTemplate: template,
      buttonText,
      welcomeMessage,
      widgetCoverImage,
      plan: isPro ? 'PRO' : 'BASIC'
    },
    products: previewProducts.map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      category: p.category,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      badge: p.badge,
      externalId: p.externalId,
      attributes: p.attributes
    }))
  };

  const handleSelfieUpload = (file: File, preview: string) => {
    setPreviewSelfie(preview);
    setStep('select');
  };

  const handleReset = () => {
    setPreviewSelfie(null);
    setStep('select');
    setSelectedProduct(null);
  };

  const commonProps = {
    step: step,
    config,
    brandSlug: 'preview',
    isEmbed: false,
    pluginView: false,
    forcedLayout: 'mobile' as const, // Forzar siempre modo móvil para que el preview sea fiel
    primaryColor,
    secondaryColor,
    buttonText,
    welcomeMessage,
    selfiePreview: previewSelfie,
    selectedProduct: selectedProduct,
    resultImageUrl: null,
    generationId: null,
    error: null,
    errorIsService: false,
    notice: null,
    generatedProducts: new Map(),
    onReset: handleReset,
    onSelfieUpload: handleSelfieUpload,
    onProductSelect: (p: any) => setSelectedProduct(p),
    onGenerate: () => setStep('generating'),
    onDismissError: () => {},
    onDismissNotice: () => {},
    termsAccepted,
    onTermsAccepted: () => setTermsAccepted(true),
  };

  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return <TemplateModernSidebar {...commonProps} />;
      case 'bold':
        return <TemplateBoldProStudio {...commonProps} />;
      case 'bare':
        return <TemplateBare {...commonProps} />;
      case 'showcase':
      case 'minimal':
        return <TemplateShowcase {...commonProps} />;
      default:
        return <TemplateBare {...commonProps} />;
    }
  };

  return (
    <div className="w-full h-full overflow-hidden flex items-start justify-start" style={{ backgroundColor: secondaryColor }}>
      {/* Contenedor escalado */}
      <div 
        style={{
          width: `${INTERNAL_WIDTH}px`,
          height: `${INTERNAL_HEIGHT}px`,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          flexShrink: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        {renderTemplate()}
      </div>
    </div>
  );
}
