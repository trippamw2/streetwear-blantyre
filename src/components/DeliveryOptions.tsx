import { useState, useEffect } from "react";
import { Truck, Clock, MapPin, Check, Zap, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatMWK } from "@/data/products";

export interface DeliveryCompany {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_same_day: boolean;
  service_area: string[];
  estimated_days: number;
  base_fee_mwk: number;
}

interface DeliveryOptionsProps {
  selectedCompany: DeliveryCompany | null;
  onSelect: (company: DeliveryCompany) => void;
  location: string;
}

export const getDeliveryCompanies = async (location: string): Promise<DeliveryCompany[]> => {
  try {
    const { data, error } = await supabase
      .from("delivery_companies")
      .select("*")
      .eq("is_active", true)
      .order("base_fee_mwk", { ascending: true });
    
    if (!error && data) {
      return data.map(c => ({
        ...c,
        service_area: c.service_area || [],
      }));
    }
  } catch {
    console.error("Failed to fetch delivery companies");
  }
  return [];
};

export const DeliveryOptions = ({ selectedCompany, onSelect, location }: DeliveryOptionsProps) => {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeliveryCompanies(location).then(data => {
      setCompanies(data);
      setLoading(false);
    });
  }, [location]);

  const formatDuration = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    if (days <= 5) return `${days} days`;
    return `${days} days`;
  };

  const getIcon = (company: DeliveryCompany) => {
    if (company.is_same_day) return <Zap className="h-5 w-5 text-yellow-500" />;
    if (company.base_fee_mwk === 0) return <Package className="h-5 w-5 text-green-500" />;
    return <Truck className="h-5 w-5 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Select your preferred delivery method</p>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="p-4 bg-muted rounded-xl text-center">
        <Truck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Enter your location to see delivery options</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Select your preferred delivery method</p>
      <div className="grid gap-4">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => onSelect(company)}
            className={cn(
              "relative p-5 rounded-2xl border-2 text-left transition-all duration-200",
              "hover:border-primary/50 hover:shadow-glow",
              selectedCompany?.id === company.id
                ? "border-primary bg-primary/5 shadow-glow"
                : "border-border bg-card hover:bg-secondary/30"
            )}
          >
            {selectedCompany?.id === company.id && (
              <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-gradient-brand flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                selectedCompany?.id === company.id
                  ? "bg-gradient-brand"
                  : "bg-secondary"
              )}>
                {getIcon(company)}
              </div>

              <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-lg">{company.name}</p>
                    <span className="font-bold text-lg">
                      {company.base_fee_mwk === 0 ? "FREE" : formatMWK(company.base_fee_mwk)}
                    </span>
                  </div>
                <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(company.estimated_days)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.service_area.includes("all") ? "Nationwide" : company.service_area.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
        <p className="text-sm text-green-500 font-medium">No hidden fees. Price you see is what you pay.</p>
      </div>
    </div>
  );
};

export default DeliveryOptions;