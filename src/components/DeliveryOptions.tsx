import { MapPin, Check, Zap, Truck, Clock, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DeliveryOption,
  type DeliverySpeed,
  getDeliveryOptions,
  detectZone,
  formatDeliveryFee,
  FREE_DELIVERY_THRESHOLD,
} from "@/lib/deliveryRules";

// Re-export for backwards compatibility
export type DeliveryCompany = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_same_day: boolean;
  service_area: string[];
  estimated_days: number;
  base_fee_mwk: number;
};

interface DeliveryOptionsProps {
  selectedOption: DeliveryOption | null;
  onSelect: (option: DeliveryOption) => void;
  location: string;
  subtotal: number;
}

export const DeliveryOptions = ({ selectedOption, onSelect, location, subtotal }: DeliveryOptionsProps) => {
  const options = getDeliveryOptions(location, subtotal);
  const zone = detectZone(location);
  const isFreeOrder = subtotal >= FREE_DELIVERY_THRESHOLD;

  return (
    <div className="space-y-4">
      {/* Zone detection badge */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
        <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
        <div className="text-xs">
          <span className="text-blue-800 font-medium">
            {zone === "blantyre" ? "Blantyre" : "Outside Blantyre"}
          </span>
          <span className="text-blue-600 ml-1.5">
            detected from "{location}"
          </span>
        </div>
      </div>

      {/* Free delivery banner for ≥50k */}
      {isFreeOrder && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
          <Gift className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700 font-medium">
            Orders over K50,000 get free standard delivery! Express available at K2,000.
          </p>
        </div>
      )}

      <p className="text-sm font-medium text-gray-600">Select your delivery option</p>

      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = selectedOption?.id === option.id;
          const isFree = option.fee === 0;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={cn(
                "relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200",
                "hover:border-blue-400/50",
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              )}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                  isSelected ? "bg-blue-500" : "bg-gray-100"
                )}>
                  {option.id === "same_day" ? (
                    <Zap className={cn("h-5 w-5", isSelected ? "text-white" : "text-amber-500")} />
                  ) : option.id === "express" ? (
                    <Zap className={cn("h-5 w-5", isSelected ? "text-white" : "text-blue-500")} />
                  ) : (
                    <Truck className={cn("h-5 w-5", isSelected ? "text-white" : "text-gray-500")} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-base text-gray-900">{option.label}</p>
                    <span className={cn(
                      "font-bold text-base shrink-0",
                      isFree ? "text-green-600" : "text-gray-900"
                    )}>
                      {formatDeliveryFee(option.fee)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{option.estimatedDays}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
        <p className="text-xs text-green-600 font-medium">No hidden fees. Price you see is what you pay.</p>
      </div>
    </div>
  );
};

export default DeliveryOptions;
