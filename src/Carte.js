import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';

// Fix icônes Leaflet (bug webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icône bleue (défaut)
const iconeDefaut = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icône rouge pour l'arrêt le plus proche
const iconeProche = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Formule de Haversine
function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Composant interne : bouton centrer (doit être DANS MapContainer pour useMap)
function BoutonCentrer({ position }) {
  const map = useMap();
  if (!position) return null;
  return (
    <div className="bouton-centrer-container">
      <button
        className="bouton-centrer"
        onClick={() => map.setView(position, 15)}
      >
        📍 Centrer sur ma position
      </button>
    </div>
  );
}

function Carte() {
  const [arrets, setArrets] = useState([]);
  const [positionUtilisateur, setPositionUtilisateur] = useState(null);
  const [arretProche, setArretProche] = useState(null);
  const [top3, setTop3] = useState([]); // Exercice 3
  const DAKAR = [14.6928, -17.4467];

  // 1) Charger les arrêts depuis Flask
  useEffect(() => {
    fetch("http://localhost:5000/arrets")
      .then(r => r.json())
      .then(data => setArrets(data))
      .catch(err => console.error("Erreur arrets :", err));
  }, []);

  // 2) Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setPositionUtilisateur([pos.coords.latitude, pos.coords.longitude]);
        },
        () => console.log("Géolocation refusée")
      );
    }
  }, []);

  // 3) Trouver l'arrêt le plus proche + top 3
  useEffect(() => {
    if (positionUtilisateur && arrets.length > 0) {
      // Calculer la distance pour chaque arrêt
      const arretsAvecDistance = arrets.map(a => ({
        ...a,
        distance: calculerDistance(positionUtilisateur[0], positionUtilisateur[1], a.lat, a.lon)
      }));

      // Trier par distance croissante
      arretsAvecDistance.sort((a, b) => a.distance - b.distance);

      // Le plus proche
      setArretProche(arretsAvecDistance[0]);

      // Les 3 premiers
      setTop3(arretsAvecDistance.slice(0, 3));
    }
  }, [positionUtilisateur, arrets]);

  return (
    <div className="carte-container">
      <h2 className="carte-titre">Carte des arrêts</h2>

      {/* Exercice 3 : liste des 3 arrêts les plus proches */}
      {top3.length > 0 && (
        <div className="top3-container">
          <h3 className="top3-titre">3 arrêts les plus proches</h3>
          <ol className="top3-liste">
            {top3.map((a, index) => (
              <li key={a.id} className={index === 0 ? 'top3-item top3-premier' : 'top3-item'}>
                <strong>{a.nom}</strong> — {a.distance.toFixed(1)} km
                <span className="top3-lignes"> (lignes : {a.lignes.join(", ")})</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Message arrêt le plus proche (exercice 1) */}
      {arretProche && (
        <p className="arret-proche">
          Arrêt le plus proche : <strong>{arretProche.nom}</strong>{" "}
          ({arretProche.distance.toFixed(1)} km)
        </p>
      )}

      <MapContainer center={DAKAR} zoom={13} className="carte">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        {arrets.map(a => (
          <Marker
            key={a.id}
            position={[a.lat, a.lon]}
            icon={arretProche && arretProche.id === a.id ? iconeProche : iconeDefaut}
          >
            <Popup>
              <strong>{a.nom}</strong><br />
              Lignes : {a.lignes.join(", ")}
            </Popup>
          </Marker>
        ))}
        {positionUtilisateur && (
          <Marker position={positionUtilisateur}>
            <Popup>Vous êtes ici</Popup>
          </Marker>
        )}
        <BoutonCentrer position={positionUtilisateur} />
      </MapContainer>
    </div>
  );
}

export default Carte;