import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Fish, Minus, Package, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLakeFreshCart } from "@/contexts/LakeFreshCartContext";
import { useLakeFreshDeliveryConfig } from "@/hooks/useLakeFresh";
import { calculateFinalPrice, getEffectiveWeightKg } from "@/lib/lfDelivery";
import { formatMWK } from "@/data/products";

const prepLabel = (value: string) =>
  value === "whole" ? "Whole" : value === "cleaned" ? "Cleaned" : value === "portioned" ? "Portioned" : value;

const LakeFreshCart = () => {
  const { items, setWeight, setQuantity, setPreparation, remove, subtotal, totalWeight } = useLakeFreshCart();
  const { data: config } = useLakeFreshDeliveryConfig();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <SEO brand="lake-fresh" title="Your Basket — Lake Fresh Fish Mart" description="Your Lake Fresh fish basket." />
        <ShoppingBasket className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-[#073B78]">Your basket is empty</h1>
        <p className="mt-2 text-sm text-gray-500">Add fresh fish from today&apos;s catch to get started.</p>
        <Link
          to="/lf/fish"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#073B78] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
        >
          Browse the catch
        </Link>
      </div>
    );
  }

  const freeThreshold = config?.freeDeliveryThresholdMwk ?? 15000;

  return (
    <div className="bg-white">
      <SEO brand="lake-fresh" title="Your Basket — Lake Fresh Fish Mart" description="Review your Lake Fresh fish order." />
      <div className="container max-w-4xl py-10 sm:py-14">
        <Link
          to="/lf/fish"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#073B78]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Keep shopping
        </Link>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#073B78]">YOUR BASKET</h1>
        <p className="mt-2 text-sm text-gray-500">
          {totalWeight.toFixed(1)} kg of fresh fish · delivery date and slot selected at checkout.
        </p>

        <div className="mt-8 space-y-4">
          {items.map((item) => {
            if (item.kind === "unit") {
              const qty = item.quantity || 1;
              const lineTotal = (item.unitPriceMwk || 0) * qty;
              return (
                <div key={item.key} className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#073B78]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-[#08A9E8]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-extrabold text-[#073B78]">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.itemType ? item.itemType.toUpperCase() : "ITEM"}
                            {item.unit ? ` · ${item.unit}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.key)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quantity</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, qty - 1)}
                            disabled={qty <= 1}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-[#073B78] disabled:opacity-40"
                            aria-label="Reduce quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-20 text-center text-sm font-bold text-[#073B78]">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, qty + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-[#073B78]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:w-28">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Line total</p>
                      <p className="text-lg font-extrabold text-[#073B78]">{formatMWK(lineTotal)}</p>
                    </div>
                  </div>
                </div>
              );
            }

            const minWeight = item.minOrderQtyKg || 0.5;
            const effective = getEffectiveWeightKg(item.weightKg || 0, minWeight);
            const lineTotal = calculateFinalPrice(item.pricePerKgMwk || 0, item.weightKg || 0, minWeight);
            const options =
              item.preparationOptions && item.preparationOptions.length > 0
                ? item.preparationOptions
                : [item.preparation || "whole"];

            return (
              <div key={item.key} className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#073B78]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      <Fish className="h-8 w-8 text-[#08A9E8]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-extrabold text-[#073B78]">
                          {item.speciesName || item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatMWK(item.pricePerKgMwk || 0)} / kg · minimum {minWeight} kg
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.key)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Weight</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setWeight(item.key, Math.max(minWeight, (item.weightKg || 0) - 0.5))}
                            disabled={(item.weightKg || 0) <= minWeight}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-[#073B78] disabled:opacity-40"
                            aria-label="Reduce weight"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-20 text-center text-sm font-bold text-[#073B78]">
                            {effective.toFixed(1)} kg
                          </span>
                          <button
                            type="button"
                            onClick={() => setWeight(item.key, (item.weightKg || 0) + 0.5)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-[#073B78]"
                            aria-label="Increase weight"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Preparation</p>
                        <select
                          value={item.preparation || "whole"}
                          onChange={(e) => setPreparation(item.key, e.target.value)}
                          className="mt-1.5 h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm font-semibold text-[#073B78]"
                          aria-label={`Preparation for ${item.name}`}
                        >
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {prepLabel(option)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:w-28">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Line total</p>
                    <p className="text-lg font-extrabold text-[#073B78]">{formatMWK(lineTotal)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-[#073B78]">{formatMWK(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className="text-xs text-gray-500">Calculated by zone at checkout</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-extrabold text-[#073B78]">
              <span>Estimated total</span>
              <span>{formatMWK(subtotal)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Free delivery on orders over {formatMWK(freeThreshold)}. Final item value is confirmed on packed weight.
          </p>
          <button
            type="button"
            onClick={() => navigate("/lf/checkout")}
            className="mt-5 w-full rounded-lg bg-[#073B78] py-3.5 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white hover:bg-[#073B78]/90"
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LakeFreshCart;
