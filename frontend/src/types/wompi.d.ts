/**
 * Declaración de tipos para el widget de Wompi.
 * El widget se carga como script externo desde checkout.wompi.co
 */
declare global {
  interface Window {
    WidgetCheckout?: new (config: WompiWidgetOptions) => WompiWidgetInstance;
  }
}

export interface WompiWidgetOptions {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature?: {
    integrity: string;
  };
  redirectUrl?: string;
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
    legalId?: string;
    legalIdType?: string;
  };
}

export interface WompiWidgetTransaction {
  id: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  reference: string;
  amountInCents: number;
  currency: string;
}

export interface WompiWidgetResult {
  transaction: WompiWidgetTransaction;
}

export interface WompiWidgetInstance {
  open: (callback: (result: WompiWidgetResult) => void) => void;
}
