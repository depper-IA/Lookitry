export interface Plan {
  type: 'BASIC' | 'PRO' | 'TRIAL';
  maxProducts: number;
  maxGenerationsPerMonth: number;
  price: number; // Para futuro
}

export const PLANS: Record<string, Plan> = {
  TRIAL: {
    type: 'TRIAL',
    maxProducts: 1,
    maxGenerationsPerMonth: 50,
    price: 0,
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
};

export const getPlanByType = (planType: 'BASIC' | 'PRO'): Plan => {
  return PLANS[planType];
};
