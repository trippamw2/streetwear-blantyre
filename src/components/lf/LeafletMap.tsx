import { useEffect, useRef, useState } from "react";

type L = any;

let leafletPromise: Promise<L> | null = null;
let leafletLoaded = false;

function loadLeaflet(): Promise<L> {
  if (leafletLoaded && (window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if ((window as any).L) {
      leafletLoaded = true;
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
    script.onload = () => {
      leafletLoaded = true;
      resolve((window as any).L);
    };
    script.onerror = () => {
      leafletPromise = null; // allow retry
      reject(new Error("Failed to load map. Check your connection."));
    };
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
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        if (mapRef.current) return;
        // Ensure container has dimensions before init
        const el = containerRef.current;
        if (el.clientWidth === 0 || el.clientHeight === 0) {
          // Defer init until layout is ready
          setTimeout(() => {
            if (cancelled || mapRef.current) return;
            initMap(L, el);
          }, 100);
          return;
        }
        initMap(L, el);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load map");
      });

    function initMap(L: any, el: HTMLDivElement) {
      try {
        const map = L.map(el, { zoomControl: true }).setView(center, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        map.on("click", (e: any) => {
          if (onClickRef.current) onClickRef.current(e.latlng.lat, e.latlng.lng);
        });
        mapRef.current = map;
        setReady(true);
      } catch (e: any) {
        setError(e?.message || "Map failed to initialize");
      }
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch { /* best-effort: ignore */ }
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTick]);

  // Update view when center/zoom change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  // Invalidate size when becoming visible (tab switches, etc.)
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(() => {
      try {
        mapRef.current.invalidateSize();
      } catch { /* best-effort: ignore */ }
    });
    obs.observe(el);
    // initial
    try {
      mapRef.current.invalidateSize();
    } catch { /* best-effort: ignore */ }
    return () => obs.disconnect();
  }, [ready]);

  // Render markers / polyline
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = (window as any).L;
    if (layerRef.current) {
      try {
        mapRef.current.removeLayer(layerRef.current);
      } catch { /* best-effort: ignore */ }
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
      L.marker([marker.lat, marker.lng]).addTo(group);
    }
    (markers || []).forEach((m) => {
      const mk = L.marker([m.lat, m.lng], m.color ? { icon: icon(m.color) } : undefined);
      if (m.label) mk.bindPopup(m.label);
      mk.addTo(group);
    });
    if (polyline && polyline.length > 1) {
      L.polyline(polyline, { color: "#073B78", weight: 4, opacity: 0.8 }).addTo(group);
    }
    layerRef.current = group;
  }, [ready, marker, markers, polyline]);

  // Keep onClick handler fresh
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.off("click");
    if (onClick) mapRef.current.on("click", (e: any) => onClick(e.latlng.lat, e.latlng.lng));
  }, [onClick]);

  if (error) {
    return (
      <div
        className={className}
        style={{ height, width: "100%", borderRadius: 12, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}
      >
        <span className="text-sm text-red-600">{error}</span>
        <button
          type="button"
          onClick={() => setRetryTick((t) => t + 1)}
          className="rounded-lg bg-[#073B78] px-3 py-1.5 text-xs font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%", borderRadius: 12, overflow: "hidden", background: "#f1f5f9" }}
    >
      {!ready && (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="text-xs text-[#073B78]/60">Loading map…</span>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
