export const DEFAULT_PRICING = {
  BASIC: {
    price: 150000,
    generations: 400,
  },
  PRO: {
    price: 250000,
    generations: 1200,
  },
  TRIAL: {
    price: 20000,
    generations: 15,
  },
} as const;

export const FALLBACK_PRICES = {
  BASIC: 150000,
  PRO: 250000,
  TRIAL: 20000,
} as const;

export const FALLBACK_GENERATIONS = {
  BASIC: 400,
  PRO: 1200,
  TRIAL: 15,
} as const;

export type PlanType = keyof typeof DEFAULT_PRICING;