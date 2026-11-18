import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BRANDS } from "@/lib/brands";
import { parseDeliveryConfig, type LFDeliveryConfig } from "@/lib/lfDelivery";
import {
  isPilotSpeciesSlug,
  isPilotZoneSlug,
  pilotZoneSlugFromName,
  sortPilotProducts,
  sortPilotZones,
} from "@/lib/lfPilot";
import { lfGalleryImages } from "@/lib/lfImages";

export const LF_BRAND_ID = BRANDS["lake-fresh"].id;

export interface LFCatalogProduct {
  id: string;
  speciesId: string | null;
  speciesName: string | null;
  speciesSlug: string | null;
  name: string;
  description: string | null;
  pricePerKgMwk: number;
  minOrderQtyKg: number;
  preparationOptions: string[];
  availabilityStatus: "available" | "sold_out" | string;
  image: string | null;
  images: string[];
  storageInfo: string | null;
  handlingInfo: string | null;
  availableKg: number;
  sortOrder: number;
  pilotOption: string | null;
}

export interface LFDeliveryZone {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  baseFeeMwk: number;
  minOrderMwk: number;
}

export interface LFDeliverySlot {
  id: string;
  zoneId: string;
  deliveryDate: string;
  cutoffAt: string;
  capacityOrders: number;
  bookedOrders: number;
  capacityWeightKg: number;
  bookedWeightKg: number;
  isOpen: boolean;
}

const toNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

export const useLakeFreshCatalog = () =>
  useQuery({
    queryKey: ["lf", "catalog"],
    queryFn: async (): Promise<LFCatalogProduct[]> => {
      const { data, error } = await supabase.rpc("lf_public_catalog");
      if (error) throw new Error(error.message);

      const products: LFCatalogProduct[] = ((data || []) as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        speciesId: row.species_id ? String(row.species_id) : null,
        speciesName: row.species_name ? String(row.species_name) : null,
        speciesSlug: row.species_slug ? String(row.species_slug) : null,
        name: String(row.name),
        description: row.description ? String(row.description) : null,
        pricePerKgMwk: toNumber(row.price_per_kg_mwk),
        minOrderQtyKg: toNumber(row.min_order_qty_kg, 0.5),
        preparationOptions: toStringArray(row.preparation_options),
        availabilityStatus: String(row.availability_status || "sold_out"),
        image: row.image ? String(row.image) : null,
        images: lfGalleryImages(row.image ? String(row.image) : null, row.images),
        storageInfo: row.storage_info ? String(row.storage_info) : null,
        handlingInfo: row.handling_info ? String(row.handling_info) : null,
        availableKg: toNumber(row.available_kg),
        sortOrder: toNumber(row.sort_order),
        pilotOption: row.pilot_option ? String(row.pilot_option) : null,
      }));

      const pilotProducts = sortPilotProducts(
        products.filter(
          (product) =>
            Boolean(product.pilotOption) ||
            isPilotSpeciesSlug(product.speciesSlug)
        )
      );
      return pilotProducts.length > 0 ? pilotProducts : products;
    },
  });

export const useLakeFreshDeliveryConfig = () =>
  useQuery({
    queryKey: ["lf", "delivery-config"],
    queryFn: async (): Promise<LFDeliveryConfig> => {
      const { data, error } = await supabase.rpc("lf_public_config");
      if (error) throw new Error(error.message);
      return parseDeliveryConfig((data || {}) as Record<string, unknown>);
    },
  });

export const useLakeFreshZones = () =>
  useQuery({
    queryKey: ["lf", "zones"],
    queryFn: async (): Promise<LFDeliveryZone[]> => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("id, name, slug, description, base_fee_mwk, min_order_mwk")
        .eq("brand_id", LF_BRAND_ID)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw new Error(error.message);

      const zones = (data || []).map((zone) => ({
        id: zone.id,
        name: zone.name,
        slug: zone.slug,
        description: zone.description,
        baseFeeMwk: toNumber(zone.base_fee_mwk),
        minOrderMwk: toNumber(zone.min_order_mwk),
      }));

      const pilotZones = zones.filter(
        (zone) => isPilotZoneSlug(zone.slug) || pilotZoneSlugFromName(zone.name) !== null
      );
      return sortPilotZones(pilotZones);
    },
  });

export const useLakeFreshSlots = (zoneId: string | null | undefined, dates: string[]) =>
  useQuery({
    queryKey: ["lf", "slots", zoneId, dates.join(",")],
    enabled: Boolean(zoneId) && dates.length > 0,
    queryFn: async (): Promise<LFDeliverySlot[]> => {
      const { data, error } = await supabase
        .from("delivery_slots")
        .select(
          "id, zone_id, delivery_date, cutoff_at, capacity_orders, booked_orders, capacity_weight_kg, booked_weight_kg, is_open"
        )
        .eq("brand_id", LF_BRAND_ID)
        .eq("zone_id", zoneId as string)
        .eq("is_open", true)
        .in("delivery_date", dates)
        .order("delivery_date", { ascending: true });

      if (error) throw new Error(error.message);

      return (data || []).map((slot) => ({
        id: slot.id,
        zoneId: slot.zone_id || "",
        deliveryDate: slot.delivery_date,
        cutoffAt: slot.cutoff_at,
        capacityOrders: toNumber(slot.capacity_orders),
        bookedOrders: toNumber(slot.booked_orders),
        capacityWeightKg: toNumber(slot.capacity_weight_kg),
        bookedWeightKg: toNumber(slot.booked_weight_kg),
        isOpen: Boolean(slot.is_open),
      }));
    },
  });
