import { useEffect, useRef, useState } from "react";

type L = any;

let leafletPromise: Promise<L> | null = null;
function loadLeaflet(): Promise<L> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error("Failed to load map"));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

export interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  marker?: { lat: number; lng: number } | null;
  markers?: MapMarker[];
  polyline?: [number, number][];
  onClick?: (lat: number, lng: number) => void;
  height?: number;
  className?: string;
}

export const LeafletMap = ({
  center = [-15.7861, 35.0058],
  zoom = 13,
  marker = null,
  markers = [],
  polyline = [],
  onClick,
  height = 320,
  className = "",
}: LeafletMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L>(null);
  const layerRef = useRef<L>(null);
  const onClickRef = useRef(onClick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, { zoomControl: true }).setView(center, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        map.on("click", (e: any) => {
          if (onClickRef.current) onClickRef.current(e.latlng.lat, e.latlng.lng);
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = (window as any).L;
    if (layerRef.current) {
      mapRef.current.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const group = L.layerGroup().addTo(mapRef.current);
    const icon = (color?: string) =>
      color
        ? L.divIcon({
            className: "",
            html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          })
        : undefined;
    if (marker) {
      const m = L.marker([marker.lat, marker.lng]);
      m.addTo(group);
    }
    (markers || []).forEach((m, i) => {
      const mk = L.marker([m.lat, m.lng], m.color ? { icon: icon(m.color) } : undefined);
      if (m.label) mk.bindPopup(m.label);
      mk.addTo(group);
    });
    if (polyline && polyline.length > 1) {
      L.polyline(polyline, { color: "#073B78", weight: 4, opacity: 0.8 }).addTo(group);
    }
    layerRef.current = group;
  }, [ready, marker, markers, polyline]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%", borderRadius: 12, overflow: "hidden", background: "#f1f5f9" }}
    />
  );
};

export default LeafletMap;
