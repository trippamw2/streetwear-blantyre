/** Lake Fresh subscription plan and monthly cost helpers. */

export const LF_SUBSCRIPTION_PLANS = [
  { value: "weekly", label: "Weekly", deliveries: 4 },
  { value: "biweekly", label: "Every 2 weeks", deliveries: 2 },
  { value: "monthly", label: "Monthly", deliveries: 1 },
] as const;

export type LFSubscriptionPlan = (typeof LF_SUBSCRIPTION_PLANS)[number]["value"];

export interface LFSubscriptionCostInput {
  plan: LFSubscriptionPlan;
  pricePerKgMwk: number;
  monthlyKg: number;
  deliveryFeeMwk: number;
  minOrderQtyKg?: number;
}

export interface LFSubscriptionCost {
  deliveriesPerMonth: number;
  minMonthlyKg: number;
  monthlyKg: number;
  perDeliveryKg: number;
  fishCostMwk: number;
  deliveryCostMwk: number;
  monthlyTotalMwk: number;
  firstPaymentMwk: number;
}

const safeNumber = (value: number, fallback = 0) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const roundKg = (value: number) => Math.round(value * 1000) / 1000;

export const deliveriesForPlan = (plan: LFSubscriptionPlan): number =>
  LF_SUBSCRIPTION_PLANS.find((item) => item.value === plan)?.deliveries ?? 4;

/**
 * The form asks for kilograms per month. The first payment and the saved
 * subscription quantity stay per delivery so the payment check on the server
 * uses the same amount the customer sees.
 */
export const calculateLFSubscriptionCost = (
  input: LFSubscriptionCostInput
): LFSubscriptionCost => {
  const deliveriesPerMonth = deliveriesForPlan(input.plan);
  const pricePerKgMwk = safeNumber(input.pricePerKgMwk);
  const deliveryFeeMwk = safeNumber(input.deliveryFeeMwk);
  const minOrderQtyKg = safeNumber(input.minOrderQtyKg, 0.5) || 0.5;
  const minMonthlyKg = roundKg(minOrderQtyKg * deliveriesPerMonth);
  const monthlyKg = roundKg(Math.max(safeNumber(input.monthlyKg), minMonthlyKg));
  const perDeliveryKg = roundKg(monthlyKg / deliveriesPerMonth);
  const fishCostMwk = Math.round(monthlyKg * pricePerKgMwk);
  const deliveryCostMwk = Math.round(deliveryFeeMwk * deliveriesPerMonth);

  return {
    deliveriesPerMonth,
    minMonthlyKg,
    monthlyKg,
    perDeliveryKg,
    fishCostMwk,
    deliveryCostMwk,
    monthlyTotalMwk: fishCostMwk + deliveryCostMwk,
    firstPaymentMwk: Math.round(perDeliveryKg * pricePerKgMwk + deliveryFeeMwk),
  };
};
