"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { MonitoringItem } from "../services/monitoring.service";

const DEFAULT_CENTER: [number, number] = [-2.5, 118.0];
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 16;

const createCarIcon = (color = "#2563eb") =>
    L.divIcon({
        className: "monitoring-car-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 28],
        popupAnchor: [0, -28],
        html: `
            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="0.15" />
                <rect x="8" y="14" width="20" height="8" rx="2" fill="${color}" />
                <rect x="11" y="11" width="14" height="5" rx="2" fill="${color}" />
                <circle cx="12" cy="24" r="3" fill="#111827" />
                <circle cx="24" cy="24" r="3" fill="#111827" />
            </svg>
        `.trim(),
    });

const markerIcon = createCarIcon();

function FitBounds({ points, enabled }: { points: Array<[number, number]>; enabled: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (!enabled) return;
        if (points.length === 0) {
            map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            return;
        }

        let cancelled = false;
        const bounds = L.latLngBounds(points);

        const applyBounds = () => {
            if (cancelled) return;
            if (!map.getContainer || !map.getContainer()) return;
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        };

        map.whenReady?.(applyBounds);
        if (!map.whenReady) applyBounds();

        return () => {
            cancelled = true;
        };
    }, [map, points]);

    return null;
}


function ClusteredMarkers({
    items,
    selectedId,
    onSelect,
}: {
    items: MonitoringItem[];
    selectedId?: string | null;
    onSelect?: (item: MonitoringItem) => void;
}) {
    const map = useMap();

    useEffect(() => {
        const clusterGroup = (L as any).markerClusterGroup({
            showCoverageOnHover: false,
            chunkedLoading: true,
            disableClusteringAtZoom: 18,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
        });

        items.forEach((item) => {
            const lat = Number(item.latitude);
            const lng = Number(item.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            const marker = L.marker([lat, lng], { icon: markerIcon });
            const title = item.plate || item.id;
            const location = item.lokasi || "Lokasi tidak tersedia";

            marker.bindPopup(
                `<div class="space-y-1">
                    <p class="text-sm font-semibold text-gray-900">${title}</p>
                    <p class="text-xs text-gray-600">${location}</p>
                </div>`
            );
            marker.bindTooltip(title, {
                direction: "top",
                offset: [0, -8],
                opacity: 0.9,
            });

            marker.on("click", () => onSelect?.(item));
            clusterGroup.addLayer(marker);

            if (selectedId && item.id === selectedId) {
                marker.openPopup();
            }
        });

        map.addLayer(clusterGroup);

        return () => {
            clusterGroup.clearLayers();
            map.removeLayer(clusterGroup);
        };
    }, [items, map, onSelect, selectedId]);

    return null;
}

function SelectedFocus({ item }: { item: MonitoringItem | null }) {
    const map = useMap();

    useEffect(() => {
        if (!item) return;
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        let cancelled = false;
        const focus = () => {
            if (cancelled) return;
            const container = map.getContainer?.();
            if (!container) return;
            const isLoaded = (map as any)._loaded;
            const mapPane = (map as any)._mapPane;
            if (!isLoaded || !mapPane) return;
            try {
                map.setView([lat, lng], FOCUSED_ZOOM, { animate: true });
            } catch {
                // ignore if map is mid-teardown during dev refresh
            }
        };

        map.whenReady?.(() => {
            requestAnimationFrame(focus);
        });
        if (!map.whenReady) {
            requestAnimationFrame(focus);
        }

        return () => {
            cancelled = true;
        };
    }, [item, map]);

    return null;
}

interface MonitoringMapProps {
    items: MonitoringItem[];
    selectedId?: string | null;
    onSelect?: (item: MonitoringItem) => void;
}

const MonitoringMap: React.FC<MonitoringMapProps> = ({ items, selectedId, onSelect }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    const points = useMemo(
        () =>
            items
                .map((item) => [Number(item.latitude), Number(item.longitude)] as [number, number])
                .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng)),
        [items]
    );

    const selectedItem = items.find((item) => item.id === selectedId) || null;
    const selectedCenter: [number, number] | null = selectedItem
        ? ([Number(selectedItem.latitude), Number(selectedItem.longitude)] as [number, number])
        : null;
    const center = selectedCenter && selectedCenter.every((value) => Number.isFinite(value))
        ? selectedCenter
        : DEFAULT_CENTER;

    if (!isMounted) {
        return <div className="h-full w-full rounded-xl bg-gray-100 dark:bg-gray-900/40" />;
    }

    return (
        <MapContainer
            center={center}
            zoom={selectedItem ? FOCUSED_ZOOM : DEFAULT_ZOOM}
            scrollWheelZoom
            className="h-full w-full rounded-xl"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} enabled={!selectedItem} />
            <SelectedFocus item={selectedItem} />
            <ClusteredMarkers items={items} selectedId={selectedId} onSelect={onSelect} />
        </MapContainer>
    );
};

export default MonitoringMap;
