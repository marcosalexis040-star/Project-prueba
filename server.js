/**
 * Plan Simple SLP — Backend ultraligero
 * --------------------------------------
 * Gestiona la autenticación con Spotify usando el "Client Credentials Flow"
 * del lado del servidor, para que el Client ID / Secret y los tokens
 * NUNCA se expongan en el navegador del cliente.
 *
 * Expone:
 *   GET /api/search?q=...&type=album,track&limit=6   → búsqueda en vivo
 *   GET /api/health                                  → estado del servidor
 *
 * También sirve los archivos estáticos (index.html) para que toda la app
 * corra desde http://localhost:3000.
 */

const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Node 18+ trae fetch global. Avisamos si se usa una versión vieja.
if (typeof fetch !== 'function') {
  console.error('\n⛔ Necesitas Node.js 18 o superior (este proyecto usa fetch nativo).\n');
  process.exit(1);
}

// CORS permisivo para desarrollo local (permite abrir index.html con file://).
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ----------------------- Token (con caché en memoria) ----------------------- */
let tokenCache = { value: null, expires: 0 };

async function getAccessToken() {
  const now = Date.now();
  // Reutiliza el token si todavía es válido (margen de 5s).
  if (tokenCache.value && now < tokenCache.expires - 5000) return tokenCache.value;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'Faltan credenciales: define SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en el archivo .env'
    );
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`No se pudo obtener el token de Spotify (${res.status}): ${detail}`);
  }

  const data = await res.json();
  tokenCache = { value: data.access_token, expires: now + data.expires_in * 1000 };
  return tokenCache.value;
}

/* ------------------------------ Endpoints API ------------------------------ */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasCredentials: Boolean(CLIENT_ID && CLIENT_SECRET) });
});

app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const type = String(req.query.type || 'album,track');
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 12);
    if (!q) return res.json({ query: '', results: [] });

    const token = await getAccessToken();
    const url =
      'https://api.spotify.com/v1/search?' +
      new URLSearchParams({ q, type, limit: String(limit), market: 'MX' }).toString();

    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(r.status).json({ error: 'spotify_search_failed', detail });
    }

    const data = await r.json();
    const results = [];

    // Álbumes primero (portada original real)
    (data.albums?.items || []).forEach((a) => {
      results.push({
        type: 'album',
        id: a.id,
        title: a.name,
        artist: (a.artists || []).map((x) => x.name).join(', '),
        image: a.images?.[0]?.url || '',
        url: a.external_urls?.spotify || '',
      });
    });

    // Luego canciones (usa la portada de su álbum)
    (data.tracks?.items || []).forEach((t) => {
      results.push({
        type: 'track',
        id: t.id,
        title: t.name,
        artist: (t.artists || []).map((x) => x.name).join(', '),
        image: t.album?.images?.[0]?.url || '',
        url: t.external_urls?.spotify || '',
      });
    });

    res.json({ query: q, results });
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: String(err.message || err) });
  }
});

/* --------------------------- Archivos estáticos ---------------------------- */
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log('\n🎵  Plan Simple SLP');
  console.log(`    Servidor activo →  http://localhost:${PORT}`);
  console.log(
    CLIENT_ID && CLIENT_SECRET
      ? '    Credenciales de Spotify: ✓ detectadas\n'
      : '    Credenciales de Spotify: ✗ faltan (copia .env.example a .env)\n'
  );
});
