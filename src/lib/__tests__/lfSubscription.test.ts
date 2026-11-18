import { describe, expect, it } from "vitest";
import { calculateLFSubscriptionCost } from "../lfSubscription";

describe("Lake Fresh subscription monthly cost", () => {
  it("multiplies catch price by monthly kilograms and adds each trip fee", () => {
    const cost = calculateLFSubscriptionCost({
      plan: "monthly",
      pricePerKgMwk: 4500,
      monthlyKg: 4,
      deliveryFeeMwk: 2000,
      minOrderQtyKg: 0.5,
    });

    expect(cost.deliveriesPerMonth).toBe(1);
    expect(cost.fishCostMwk).toBe(18000);
    expect(cost.deliveryCostMwk).toBe(2000);
    expect(cost.monthlyTotalMwk).toBe(20000);
    expect(cost.firstPaymentMwk).toBe(20000);
  });

  it("splits monthly kilograms across weekly deliveries", () => {
    const cost = calculateLFSubscriptionCost({
      plan: "weekly",
      pricePerKgMwk: 3200,
      monthlyKg: 8,
      deliveryFeeMwk: 2000,
      minOrderQtyKg: 0.5,
    });

    expect(cost.deliveriesPerMonth).toBe(4);
    expect(cost.perDeliveryKg).toBe(2);
    expect(cost.fishCostMwk).toBe(25600);
    expect(cost.deliveryCostMwk).toBe(8000);
    expect(cost.monthlyTotalMwk).toBe(33600);
    expect(cost.firstPaymentMwk).toBe(8400);
  });

  it("never drops below one minimum order in each delivery", () => {
    const cost = calculateLFSubscriptionCost({
      plan: "biweekly",
      pricePerKgMwk: 2500,
      monthlyKg: 0.1,
      deliveryFeeMwk: 2000,
      minOrderQtyKg: 0.5,
    });

    expect(cost.minMonthlyKg).toBe(1);
    expect(cost.monthlyKg).toBe(1);
    expect(cost.perDeliveryKg).toBe(0.5);
    expect(cost.fishCostMwk).toBe(2500);
    expect(cost.deliveryCostMwk).toBe(4000);
    expect(cost.monthlyTotalMwk).toBe(6500);
  });
});
