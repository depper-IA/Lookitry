import type { TryOnConfigResponse } from '@/types';

export type Step = 'upload' | 'select' | 'generating' | 'result';
export type Layout = 'top-bar' | 'sidebar' | 'centered' | 'bare' | 'showcase';

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  externalId?: string | null;
}

export interface TryOnTemplateProps {
  step: Step;
  config: TryOnConfigResponse;
  brandSlug: string;
  isEmbed: boolean;
  pluginView: boolean;

  primaryColor: string;
  secondaryColor: string;
  buttonText: string;
  welcomeMessage: string;
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
  onSelfieUpload: (file: File, preview: string) => void;
  onProductSelect: (p: Product) => void;
  onGenerate: () => void;
}

