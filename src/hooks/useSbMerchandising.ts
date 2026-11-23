import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SB_BRAND_ID,
  type SbCampaign,
  type SbCollection,
  type SbCompleteLookRule,
  type SbLook,
  type SbMerchandising,
  type SbPlacement,
  type SbProductRelation,
  type SbProductType,
  type SbVariant,
} from "@/data/sbArchitecture";
import { displayCopy } from "@/lib/storefrontCopy";

export type { SbCampaign, SbCollection, SbLook, SbPlacement, SbProductType, SbVariant };

const emptyMerchandising: SbMerchandising = {
  productTypes: [],
  collections: [],
  looks: [],
  campaigns: [],
  placements: [],
  completeLookRules: [],
  relations: [],
};

export function useSbMerchandising() {
  const [data, setData] = useState<SbMerchandising>(emptyMerchandising);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        typesRes,
        collectionsRes,
        collectionProductsRes,
        looksRes,
        lookItemsRes,
        campaignsRes,
        placementsRes,
        rulesRes,
        relationsRes,
      ] = await Promise.all([
        supabase
          .from("sb_product_types")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sb_collections")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sb_collection_products")
          .select("collection_id, product_id, sort_order")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sb_looks")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sb_look_items")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sb_campaigns")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("created_at", { ascending: false }),
        supabase
          .from("sb_editorial_placements")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sb_complete_look_rules")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sb_product_relations")
          .select("*")
          .eq("brand_id", SB_BRAND_ID)
          .order("sort_order", { ascending: true }),
      ]);

      const failed = [
        typesRes,
        collectionsRes,
        collectionProductsRes,
        looksRes,
        lookItemsRes,
        campaignsRes,
        placementsRes,
        rulesRes,
        relationsRes,
      ].find((result) => result.error);
      if (failed?.error) throw failed.error;

      const productTypes: SbProductType[] = (typesRes.data || []).map((row) => ({
        id: row.id,
        code: row.code,
        label: displayCopy(row.label),
        description: displayCopy(row.description),
        sortOrder: row.sort_order,
        isActive: row.is_active,
      }));

      const collections: SbCollection[] = (collectionsRes.data || []).map((row) => ({
        id: row.id,
        kind: row.kind as SbCollection["kind"],
        name: displayCopy(row.name),
        slug: row.slug,
        description: displayCopy(row.description),
        heroImage: row.hero_image,
        isActive: row.is_active,
        isFeatured: row.is_featured,
        releaseDate: row.release_date,
        limitedDrop: row.limited_drop,
        sortOrder: row.sort_order,
        productIds: (collectionProductsRes.data || [])
          .filter((item) => item.collection_id === row.id)
          .map((item) => item.product_id),
      }));

      const looks: SbLook[] = (looksRes.data || []).map((row) => ({
        id: row.id,
        title: displayCopy(row.title),
        slug: row.slug,
        subtitle: displayCopy(row.subtitle),
        description: displayCopy(row.description),
        heroImage: row.hero_image,
        isPublished: row.is_published,
        isFeatured: row.is_featured,
        sortOrder: row.sort_order,
        items: (lookItemsRes.data || [])
          .filter((item) => item.look_id === row.id)
          .map((item) => ({
            id: item.id,
            productId: item.product_id,
            variantId: item.variant_id,
            role: displayCopy(item.role),
            stylingNote: displayCopy(item.styling_note),
            isPurchasable: item.is_purchasable,
            sortOrder: item.sort_order,
          })),
      }));

      const campaigns: SbCampaign[] = (campaignsRes.data || []).map((row) => ({
        id: row.id,
        name: displayCopy(row.name),
        slug: row.slug,
        headline: displayCopy(row.headline),
        description: displayCopy(row.description),
        heroImage: row.hero_image,
        ctaLabel: displayCopy(row.cta_label),
        ctaHref: row.cta_href,
        isActive: row.is_active,
      }));

      const placements: SbPlacement[] = (placementsRes.data || []).map((row) => ({
        id: row.id,
        sectionKey: row.section_key,
        campaignId: row.campaign_id,
        productId: row.product_id,
        lookId: row.look_id,
        collectionId: row.collection_id,
        headline: displayCopy(row.headline),
        body: displayCopy(row.body),
        ctaLabel: displayCopy(row.cta_label),
        ctaHref: row.cta_href,
        imageOverride: row.image_override,
        sortOrder: row.sort_order,
        isActive: row.is_active,
      }));

      const completeLookRules: SbCompleteLookRule[] = (rulesRes.data || []).map((row) => ({
        sourceTypeCode: row.source_type_code,
        suggestedTypeCode: row.suggested_type_code,
        sortOrder: row.sort_order,
        isActive: row.is_active,
      }));

      const relations: SbProductRelation[] = (relationsRes.data || []).map((row) => ({
        productId: row.product_id,
        relatedProductId: row.related_product_id,
        relationType: row.relation_type as SbProductRelation["relationType"],
        sortOrder: row.sort_order,
      }));

      setData({
        productTypes,
        collections,
        looks,
        campaigns,
        placements,
        completeLookRules,
        relations,
      });
    } catch (fetchError) {
      console.error("Streetwear merchandising fetch error:", fetchError);
      setError("Failed to load merchandising data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getPlacement = useCallback(
    (sectionKey: string) =>
      data.placements.find((placement) => placement.sectionKey === sectionKey && placement.isActive),
    [data.placements],
  );

  return { ...data, loading, error, refresh, getPlacement };
}

export async function fetchSbVariants(productId?: string): Promise<SbVariant[]> {
  let query = supabase
    .from("sb_product_variants")
    .select("*")
    .eq("brand_id", SB_BRAND_ID)
    .eq("is_active", true);
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query.order("size_label", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    sizeLabel: row.size_label,
    color: row.color,
    price: row.price_mwk,
    compareAtPrice: row.compare_at_price_mwk,
    costPrice: row.cost_price_mwk,
    stockQty: row.stock_qty,
    reservedQty: row.reserved_qty,
    weightGrams: row.weight_grams,
    availability: row.availability as SbVariant["availability"],
    isActive: row.is_active,
  }));
}
