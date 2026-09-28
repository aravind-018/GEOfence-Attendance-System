"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface MapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onLocationSelect: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

export default function MapPicker({
  latitude,
  longitude,
  radiusMeters,
  onLocationSelect,
  readOnly = false,
}: MapPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamic import for Leaflet CSS & React-Leaflet to avoid SSR window errors
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([ReactLeaflet, L]) => {
      // Fix default marker icon paths in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      setMapComponents({
        MapContainer: ReactLeaflet.MapContainer,
        TileLayer: ReactLeaflet.TileLayer,
        Marker: ReactLeaflet.Marker,
        Circle: ReactLeaflet.Circle,
        useMapEvents: ReactLeaflet.useMapEvents,
      });
    });
  }, []);

  if (!mounted || !MapComponents) {
    return (
      <div className="w-full h-64 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200">
        <MapPin className="w-8 h-8 text-slate-400 animate-bounce mb-2" />
        <span className="text-sm text-slate-500 font-medium">Loading Interactive Map...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Circle, useMapEvents } = MapComponents;

  function MapEvents() {
    useMapEvents({
      click(e: any) {
        if (!readOnly) {
          onLocationSelect(
            Math.round(e.latlng.lat * 1000000) / 1000000,
            Math.round(e.latlng.lng * 1000000) / 1000000
          );
        }
      },
    });
    return null;
  }

  const center: [number, number] = [latitude || 12.971598, longitude || 77.594562];

  return (
    <div className="relative w-full h-72 rounded-lg overflow-hidden border border-slate-300 shadow-sm">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
        <Circle
          center={center}
          radius={radiusMeters || 100}
          pathOptions={{
            color: "#0284c7",
            fillColor: "#38bdf8",
            fillOpacity: 0.25,
            weight: 2,
          }}
        />
        <MapEvents />
      </MapContainer>
      {!readOnly && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded text-xs font-semibold text-slate-700 shadow border border-slate-200 z-[1000]">
          Click map to set workplace coordinates
        </div>
      )}
    </div>
  );
}
