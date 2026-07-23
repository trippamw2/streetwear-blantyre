import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductAuthRecord {
  id: string;
  product_id: string;
  serial_number: string;
  qr_token: string;
  product_name: string;
  product_image: string | null;
  collection: string | null;
  category: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  print_technique: string | null;
  fabric_weight: string | null;
  edition_number: number | null;
  quantity_produced: number | null;
  country_of_manufacture: string | null;
  manufacturing_date: string | null;
  product_story: string | null;
  care_instructions: string | null;
  authentication_status: string;
  first_scan_date: string | null;
  last_scan_date: string | null;
  total_scans: number;
  registered_owner_name: string | null;
  registered_owner_phone: string | null;
  registered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScanLogRecord {
  id: string;
  product_auth_id: string;
  qr_token: string;
  scanned_at: string;
  scan_result: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  approximate_location: string | null;
  ip_hash: string | null;
  is_suspicious: boolean;
  suspicious_reason: string | null;
}

export function useProductAuthByToken(token: string | undefined) {
  const [product, setProduct] = useState<ProductAuthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    supabase
      .from("product_auth")
      .select("*")
      .eq("qr_token", token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError("Product not found");
        else setProduct(data as unknown as ProductAuthRecord);
        setLoading(false);
      });
  }, [token]);

  return { product, loading, error };
}

export function useProductAuthById(id: string | undefined) {
  const [product, setProduct] = useState<ProductAuthRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase
      .from("product_auth")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProduct(data as unknown as ProductAuthRecord | null);
        setLoading(false);
      });
  }, [id]);

  return { product, loading };
}

export function useAllProductAuth() {
  const [records, setRecords] = useState<ProductAuthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    setLoading(true);
    supabase
      .from("product_auth")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRecords((data || []) as unknown as ProductAuthRecord[]);
        setLoading(false);
      });
  };

  useEffect(() => { refetch(); }, []);

  return { records, loading, refetch };
}

export function useScanLogs(productAuthId: string | undefined) {
  const [logs, setLogs] = useState<ScanLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productAuthId) { setLoading(false); return; }
    supabase
      .from("scan_logs")
      .select("*")
      .eq("product_auth_id", productAuthId)
      .order("scanned_at", { ascending: false })
      .then(({ data }) => {
        setLogs((data || []) as unknown as ScanLogRecord[]);
        setLoading(false);
      });
  }, [productAuthId]);

  return { logs, loading };
}
