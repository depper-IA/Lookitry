export interface Plan {

  type: 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRIAL';

  minProducts: number;

  maxProducts: number;

  maxGenerationsPerMonth: number;

  price: number; // Para futuro

}



export const PLANS: Record<string, Plan> = {

  TRIAL: {

    type: 'TRIAL',

    minProducts: 0,

    maxProducts: 1,

    maxGenerationsPerMonth: 15,

    price: 20000,

  },

  BASIC: {

    type: 'BASIC',

    minProducts: 0,

    maxProducts: 5,

    maxGenerationsPerMonth: 400,

    price: 0,

  },

  PRO: {

    type: 'PRO',

    minProducts: 0,

    maxProducts: 15,

    maxGenerationsPerMonth: 1000,

    price: 0,

  },

  ENTERPRISE: {

    type: 'ENTERPRISE',

    minProducts: 50, // Minimo 16 productos, base 50 productos, luego ilimitado

    maxProducts: Infinity,

    maxGenerationsPerMonth: 2000,

    price: 800000,

  },

};


export const getPlanByType = (planType: string): Plan => {

  return PLANS[planType] || PLANS.BASIC;

};

