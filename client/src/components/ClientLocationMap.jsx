import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet with Vite
// Use CDN URLs for marker icons to avoid import issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

export default function ClientLocationMap({ initialLatLng, onConfirm, onCancel }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      // Default center (can be changed)
      const center = initialLatLng
        ? [initialLatLng.lat, initialLatLng.lng]
        : [17.385, 78.486]; // Default to a location (Hyderabad, India)

      // Initialize map
      const map = L.map(mapRef.current).setView(center, 13);

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add initial marker
      const marker = L.marker(center, { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Handle map clicks - move marker to clicked location
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
      });

      setLoading(false);
    } catch (err) {
      setError("Could not load map. Please check your connection.");
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLatLng]);

  const handleConfirm = () => {
    const marker = markerRef.current;
    if (!marker) return;
    const latlng = marker.getLatLng();
    if (!latlng) return;
    onConfirm({ lat: latlng.lat, lng: latlng.lng });
  };

  return (
    <div className="map-overlay">
      <div className="map-card">
        <h3>Pick Location</h3>
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
          Drag the pin or click on the map to choose where the work needs to be done.
        </p>
        <div className="map-container">
          {loading && <p className="info">Loading map...</p>}
          {error && <p className="info">{error}</p>}
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>
        <div className="map-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>
            Pick Location
          </button>
        </div>
      </div>
    </div>
  );
}
