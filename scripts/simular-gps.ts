import 'dotenv/config';

/**
 * 🛰️ Simulador de GPS para la demo de HU-3-002 (panel del supervisor).
 *
 * Postea ubicaciones cada pocos segundos para los buses EN_CURSO (BUS-001/002 en
 * "Ruta Centro - Sur", Manizales), moviéndolos un poco. Esto llena `flotaActiva`
 * en memoria y dispara el socket `actualizacionFlotaGlobal` → los marcadores del
 * mapa se mueven en vivo. Sin esto, el mapa solo muestra la posición fija del seed.
 *
 * Uso:  (con back-logic corriendo en :3000)
 *   npm run sim:gps
 * Ctrl-C para parar.
 */

const BASE_URL = process.env.SIM_BASE_URL ?? 'http://localhost:3000';
const API_KEY = process.env.GPS_API_KEY ?? 'gps_kala_buses_secret_key_2026';
const INTERVALO_MS = Number(process.env.SIM_INTERVALO_MS ?? 3000);

// Buses EN_CURSO del seed (ver 3programacion.seed.ts + gps.seed.ts). Posición
// inicial cerca de paraderos de "Ruta Centro - Sur".
const buses = [
  { busId: 1, lat: 5.054, lon: -75.493, velocidad: 32 },
  { busId: 2, lat: 5.067, lon: -75.516, velocidad: 28 },
];

// Pequeño "paseo": cada bus deriva en una dirección y rebota dentro de un rango.
const pasos = buses.map(() => ({
  dLat: (Math.random() - 0.5) * 0.0016,
  dLon: (Math.random() - 0.5) * 0.0016,
}));

async function postUbicacion(busId: number, latitude: number, longitude: number, velocidad: number) {
  try {
    const res = await fetch(`${BASE_URL}/monitoreo/bus/${busId}/ubicacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-gps-api-key': API_KEY },
      body: JSON.stringify({ latitude, longitude, velocidad }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`✗ bus ${busId}: HTTP ${res.status} ${txt}`);
    } else {
      console.log(`✓ bus ${busId} → ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (${velocidad} km/h)`);
    }
  } catch (e) {
    console.error(`✗ bus ${busId}: ${(e as Error).message} — ¿está corriendo back-logic en ${BASE_URL}?`);
  }
}

function tick() {
  buses.forEach((bus, i) => {
    const paso = pasos[i];
    bus.lat += paso.dLat;
    bus.lon += paso.dLon;
    // Rebote suave para que no se alejen del centro del mapa.
    if (bus.lat > 5.075 || bus.lat < 5.045) paso.dLat *= -1;
    if (bus.lon > -75.49 || bus.lon < -75.525) paso.dLon *= -1;
    bus.velocidad = 20 + Math.round(Math.random() * 25);
    void postUbicacion(bus.busId, bus.lat, bus.lon, bus.velocidad);
  });
}

console.log(`🛰️  Simulando GPS de ${buses.length} buses contra ${BASE_URL} cada ${INTERVALO_MS}ms. Ctrl-C para parar.`);
tick();
setInterval(tick, INTERVALO_MS);
