"use client";

import { useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";

import "leaflet/dist/leaflet.css";

const MILAN_CENTER = {
  lat: 45.4642,
  lng: 9.19,
};

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div
      style="
        width:24px;
        height:24px;
        border-radius:50% 50% 50% 0;
        background:#2563eb;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(15,23,42,.3);
        transform:rotate(-45deg);
      "
    ></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

type Position = {
  lat: number;
  lng: number;
};

function MapEvents({
  onSelect,
}: {
  onSelect: (position: Position) => void;
}) {
  useMapEvents({
    click(event) {
      L.DomEvent.stop(event.originalEvent);

      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function PropertyLocationMapClient() {
  const [position, setPosition] =
    useState<Position>(MILAN_CENTER);

  const [confirmed, setConfirmed] =
    useState(false);

  const updatePosition = (
    nextPosition: Position,
  ) => {
    setPosition(nextPosition);
    setConfirmed(true);
  };

  const center: LatLngExpression = [
    MILAN_CENTER.lat,
    MILAN_CENTER.lng,
  ];

  return (
    <div
      className="sm:col-span-2"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-700">
          Posizione sulla mappa
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Clicca sulla mappa oppure trascina il marker
          per confermare la posizione dell'immobile.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          className="h-80 w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEvents
            onSelect={updatePosition}
          />

          <Marker
            position={[
              position.lat,
              position.lng,
            ]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker =
                  event.target as L.Marker;

                const nextPosition =
                  marker.getLatLng();

                updatePosition({
                  lat: nextPosition.lat,
                  lng: nextPosition.lng,
                });
              },
            }}
          />
        </MapContainer>
      </div>

      <input
        type="hidden"
        name="latitude"
        readOnly
        value={
          confirmed
            ? position.lat.toFixed(7)
            : ""
        }
      />

      <input
        type="hidden"
        name="longitude"
        readOnly
        value={
          confirmed
            ? position.lng.toFixed(7)
            : ""
        }
      />

      <p
        className={`mt-2 text-xs ${
          confirmed
            ? "font-semibold text-emerald-600"
            : "text-slate-500"
        }`}
      >
        {confirmed
          ? `Posizione confermata: ${position.lat.toFixed(7)}, ${position.lng.toFixed(7)}`
          : "Posizione non ancora confermata."}
      </p>
    </div>
  );
}
