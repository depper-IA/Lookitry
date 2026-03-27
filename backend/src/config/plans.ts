export interface Plan {
  type: 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRIAL';
  maxProducts: number;
  maxGenerationsPerMonth: number;
  price: number; // Para futuro
}

export const PLANS: Record<string, Plan> = {
  TRIAL: {
    type: 'TRIAL',
    maxProducts: 1,
    maxGenerationsPerMonth: 15,
    price: 20000,
  },
  BASIC: {
    type: 'BASIC',
    maxProducts: 5,
    maxGenerationsPerMonth: 400,
    price: 0,
  },
  PRO: {
    type: 'PRO',
    maxProducts: 15,
    maxGenerationsPerMonth: 1200,
    price: 0,
  },
  ENTERPRISE: {
    type: 'ENTERPRISE',
    maxProducts: 1000,
    maxGenerationsPerMonth: 100000,
    price: 800000,
  },
};

export const getPlanByType = (planType: string): Plan => {
  return PLANS[planType] || PLANS.BASIC;
};
