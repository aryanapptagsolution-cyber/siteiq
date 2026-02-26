'use client';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { Site } from '@/types/site';
import { getBucketMapColor } from '@/utils/scoreColor';
import { useRouter } from 'next/navigation';

interface Props { sites: Site[]; }

export default function SiteMap({ sites }: Props) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<LeafletMarker[]>([]);

    // Boot the map exactly once
    useEffect(() => {
        if (!containerRef.current) return;
        let active = true;

        (async () => {
            // Dynamic import keeps Leaflet server-side free
            const L = await import('leaflet');

            // Load Leaflet CSS via a <link> tag to avoid the TS "no CSS types" error
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            if (!active || !containerRef.current) return;

            // Fix broken default icon paths (webpack / turbopack asset hashing)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = L.map(containerRef.current, {
                center: [34.0522, -118.2437],
                zoom: 11,
                zoomControl: true,
            });
            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            renderMarkers(L, map);
        })();

        return () => {
            active = false;
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            mapRef.current?.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Redraw markers when site scores change (weights updated)
    useEffect(() => {
        if (!mapRef.current) return;
        (async () => {
            const L = await import('leaflet');
            renderMarkers(L, mapRef.current!);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sites]);

    function renderMarkers(
        L: typeof import('leaflet'),
        map: LeafletMap
    ) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        sites.forEach((site) => {
            const color = getBucketMapColor(site.bucket);

            const icon = L.divIcon({
                className: '',
                html: `<div style="
          width:12px;height:12px;
          background:${color};
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 1px 5px rgba(0,0,0,0.3);
          cursor:pointer;
        "></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            });

            const marker = L.marker([site.lat, site.lng], { icon });

            marker.bindPopup(`
        <div style="font-family:Inter,system-ui,sans-serif;min-width:160px">
          <p style="font-size:11px;font-weight:700;color:#6366f1;margin:0 0 2px">${site.siteId}</p>
          <p style="font-size:11px;color:#475569;margin:0 0 6px">${site.address}</p>
          <p style="font-size:22px;font-weight:900;color:#0f172a;margin:0;line-height:1">${site.compositeScore.toFixed(1)}</p>
          <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin:2px 0 8px">Composite Score</p>
          <a href="/site/${site.id}"
             style="display:inline-block;background:#6366f1;color:white;font-size:11px;
                    font-weight:600;padding:4px 12px;border-radius:6px;text-decoration:none">
            View Detail →
          </a>
        </div>
      `, { maxWidth: 220 });

            marker.on('click', () => router.push(`/site/${site.id}`));
            marker.addTo(map);
            markersRef.current.push(marker);
        });
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: 300, zIndex: 0 }}
        />
    );
}
