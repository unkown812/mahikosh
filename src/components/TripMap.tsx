import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { TripLog, TravelMode } from "../types";

const MODE_COLORS: Record<TravelMode, string> = {
  car: "#ef4444",
  bus: "#f59e0b",
  train: "#3b82f6",
  "walk-bike": "#22c55e",
};

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  if (coords.length > 0) {
    map.fitBounds(coords, { padding: [50, 50] });
  }
  return null;
}

interface TripMapProps {
  trips: TripLog[];
  selectedTripId?: string;
  onTripSelect?: (id: string) => void;
  currentPosition?: [number, number];
  currentPolyline?: [number, number][];
}

export default function TripMap({ trips, selectedTripId, onTripSelect, currentPosition, currentPolyline }: TripMapProps) {
  const allCoords: [number, number][] = [];

  trips.forEach(t => {
    if (t.routeCoordinates && t.routeCoordinates.length > 0) {
      t.routeCoordinates.forEach(c => allCoords.push([c.lat, c.lng]));
    }
  });
  if (currentPosition) allCoords.push(currentPosition);

  const center: [number, number] = allCoords.length > 0
    ? allCoords.reduce((acc, c) => [acc[0] + c[0] / allCoords.length, acc[1] + c[1] / allCoords.length], [0, 0])
    : [19.076, 72.877];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full rounded-xl"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trips.map(trip => {
        if (!trip.routeCoordinates || trip.routeCoordinates.length < 2) return null;
        const positions: [number, number][] = trip.routeCoordinates.map(c => [c.lat, c.lng]);
        const color = MODE_COLORS[trip.mode] || "#888";
        const isSelected = trip.id === selectedTripId;

        return (
          <React.Fragment key={trip.id}>
            <Polyline
              positions={positions}
              pathOptions={{
                color,
                weight: isSelected ? 5 : 3,
                opacity: isSelected ? 1 : 0.7,
              }}
              eventHandlers={{
                click: () => onTripSelect?.(trip.id),
              }}
            />
            <Marker
              position={positions[0]}
              icon={L.divIcon({
                className: "bg-transparent",
                html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            >
              <Popup>
                <div className="text-xs font-medium">
                  <p><strong>{trip.mode}</strong> — {trip.distance.toFixed(1)} km</p>
                  <p className="text-red-600">{trip.co2_emission.toFixed(2)} kg CO₂</p>
                  <p className="text-gray-500">{new Date(trip.createdAt).toLocaleDateString()}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {currentPolyline && currentPolyline.length > 1 && (
        <Polyline
          positions={currentPolyline}
          pathOptions={{ color: "#9fe870", weight: 4, dashArray: "10 10" }}
        />
      )}

      {currentPosition && (
        <Marker
          position={currentPosition}
          icon={L.divIcon({
            className: "bg-transparent",
            html: `<div style="background:#9fe870;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        />
      )}

      {allCoords.length > 0 && <FitBounds coords={allCoords} />}
    </MapContainer>
  );
}
