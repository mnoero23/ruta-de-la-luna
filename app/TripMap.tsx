"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

const baseStops = [
  { day: "Inicio", name: "Córdoba", coords: [-31.4201, -64.1888], next: "Chilecito" },
  { day: "19–21 sep", name: "Chilecito", coords: [-29.165, -67.497], next: "Villa Unión" },
  { day: "21–23 sep", name: "Villa Unión", coords: [-29.315, -68.226], next: "Talampaya" },
  { day: "22 sep", name: "Talampaya", coords: [-29.786, -67.993], next: "Barreal" },
  { day: "23–25 sep", name: "Barreal", coords: [-31.643, -69.475], next: "El Leoncito" },
  { day: "24 sep", name: "El Leoncito", coords: [-31.798, -69.295], next: "Valle Fértil" },
  { day: "25–26 sep", name: "Valle Fértil", coords: [-30.633, -67.468], next: "Ischigualasto" },
  { day: "26 sep", name: "Ischigualasto", coords: [-30.116, -67.9], next: "Los Baldecitos" },
  { day: "26–27 sep", name: "Los Baldecitos", coords: [-30.224, -67.701], next: "Córdoba" },
  { day: "Regreso", name: "Córdoba", coords: [-31.4201, -64.1888], next: "" },
] as const;

function directions(origin: string, destination: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin + ", Argentina")}&destination=${encodeURIComponent(destination + ", Argentina")}&travelmode=driving`;
}

type MapStay = { city: string; name: string; status: string; mapsQuery: string; address: string };

export default function TripMap({ stays }: { stays: MapStay[] }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [selected, setSelected] = useState(0);
  const confirmedFor = (city: string) => stays.find(stay => stay.city === city && /confirmado|reservado/i.test(stay.status));
  const stops = baseStops.map((stop) => {
    const lodging = confirmedFor(stop.name);
    return lodging ? { ...stop, name: lodging.name, routeQuery: lodging.mapsQuery || lodging.address, city: stop.name } : { ...stop, routeQuery: stop.name, city: stop.name };
  });

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !mapNode.current) return;
      const map = L.map(mapNode.current, { scrollWheelZoom: false, zoomControl: true });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const latLngs = stops.map((stop) => stop.coords as [number, number]);
      L.polyline(latLngs, { color: "#b94f32", weight: 4, opacity: 0.85, dashArray: "8 7" }).addTo(map);
      stops.slice(0, -1).forEach((stop, index) => {
        const icon = L.divIcon({ className: "route-pin-wrap", html: `<span class="route-pin">${index + 1}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
        L.marker(stop.coords as [number, number], { icon }).addTo(map).bindTooltip(`${stop.day} · ${stop.name}`, { direction: "top" }).on("click", () => setSelected(index));
      });
      map.fitBounds(L.latLngBounds(latLngs), { padding: [28, 28] });
    });
    return () => { disposed = true; const map = mapRef.current as { remove?: () => void } | null; map?.remove?.(); mapRef.current = null; };
  }, [stays]);

  const stop = stops[selected];
  return <div className="map-layout">
    <div className="map-shell"><div ref={mapNode} className="trip-map" aria-label="Mapa interactivo del recorrido" /></div>
    <aside className="map-stops">
      <p className="mini">PARADA {selected + 1} DE 9</p>
      <h3>{stop.name}</h3><p>{stop.day}</p>
      {stop.next && <a href={directions(stop.routeQuery, confirmedFor(stop.next)?.mapsQuery || stop.next)} target="_blank" rel="noreferrer">Abrir tramo a {confirmedFor(stop.next)?.name || stop.next} en Google Maps →</a>}
      <div className="stop-list">{stops.slice(0, -1).map((item, index) => <button key={`${item.name}-${index}`} className={selected === index ? "active" : ""} onClick={() => setSelected(index)}><span>{index + 1}</span><b>{item.name}</b><small>{item.day}</small></button>)}</div>
    </aside>
  </div>;
}
