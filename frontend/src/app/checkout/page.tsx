import CheckoutPageClient from './page.client';
export type { PlanKey, SubPlan } from './page.client';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
