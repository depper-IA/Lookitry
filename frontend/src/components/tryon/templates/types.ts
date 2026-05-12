import type { TryOnConfigResponse } from '@/types';

export type Step = 'upload' | 'select' | 'generating' | 'result';
export type Layout = 'top-bar' | 'sidebar' | 'centered' | 'bare' | 'showcase';

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  description?: string;
  shortDescription?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  externalId?: string | null;
  attributes?: Record<string, any>;
}

export interface TryOnTemplateProps {
  step: Step;
  config: TryOnConfigResponse;
  brandSlug: string;
  isEmbed: boolean;
  pluginView: boolean;
  lockProductSelection?: boolean;
  forcedLayout?: 'mobile' | 'desktop'; // Para preview en frameworks de móvil

  primaryColor: string;
  secondaryColor: string;
  buttonText: string;
  welcomeMessage: string;
  shareMessage?: string | null; // Custom share message (PRO/ENTERPRISE)
  privacyNotice?: string;

  selfiePreview: string | null;
  selectedProduct: Product | null;
  resultImageUrl: string | null;
  generationId: string | null;
  error: string | null;
  errorIsService: boolean;
  notice: string | null;

  generatedProducts: Map<string, string>;

  onReset: () => void;
  onSelfieReset?: () => void;
  onSelfieUpload: (file: File, preview: string) => void;
  onProductSelect: (p: Product) => void;
  onProductReset?: () => void;
  onProceedToUpload?: () => void;
  onBack?: () => void;
  onGenerate: () => void;
  onDismissError: () => void;
  onDismissNotice: () => void;

  // Terms acceptance (legal disclaimer)
  termsAccepted: boolean;
  onTermsAccepted: () => void;
}


