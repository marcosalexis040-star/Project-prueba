# Plan Simple SLP 🎵

Landing page de una sola página para **Plan Simple SLP** — llaveros de Mini CD
musicales personalizados en San Luis Potosí. Diseño dark estilo Spotify, con
preview en vivo del llavero (portada real + QR), paquetes con precios dinámicos
y pedido directo por WhatsApp.

El repo incluye un **backend ultraligero (Express)** opcional que habilita la
**búsqueda en vivo de Spotify** con portadas reales, manejando la autenticación
(*Client Credentials Flow*) del lado del servidor para no exponer tokens en el
navegador.

> La página funciona **sin backend** (usa Spotify oEmbed para los links + un
> catálogo de respaldo). El backend solo agrega la **búsqueda por nombre 100% en
> vivo** contra toda la API de Spotify.

---

## 🚀 Cómo correr la búsqueda en vivo (backend) localmente

### 1. Requisitos
- **Node.js 18 o superior** (usa `fetch` nativo). Verifica con `node -v`.

### 2. Consigue tus credenciales de Spotify (gratis)
1. Entra a <https://developer.spotify.com/dashboard> e inicia sesión.
2. **Create app** (cualquier nombre, ej. "Plan Simple SLP"). En *Redirect URI*
   puedes poner `http://localhost:3000` (no se usa en este flujo, pero el panel
   lo pide).
3. Abre la app creada → **Settings** → copia el **Client ID** y el
   **Client Secret**.

### 3. Instala dependencias
```bash
npm install
```

### 4. Configura el archivo .env
Copia la plantilla y pega tus credenciales:
```bash
cp .env.example .env
```
Luego edita `.env`:
```
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
PORT=3000
```
> ⚠️ El archivo `.env` está en `.gitignore` — nunca subas tus credenciales.

### 5. Inicia el servidor
```bash
npm start
```
Verás:
```
🎵  Plan Simple SLP
    Servidor activo →  http://localhost:3000
    Credenciales de Spotify: ✓ detectadas
```

### 6. Abre la app
Ve a **<http://localhost:3000>** en tu navegador. Al escribir en
*"Nombre del Artista / Álbum"* aparecerá un dropdown con resultados reales de
Spotify y sus portadas; al elegir uno se carga la portada, se autocompleta el
link y se genera el QR.

Para desarrollo con recarga automática: `npm run dev`.

---

## 🔌 Endpoints del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/search?q=texto&type=album,track&limit=6` | Busca en Spotify y devuelve `{ results: [{ type, id, title, artist, image, url }] }` |
| `GET` | `/api/health` | `{ ok: true, hasCredentials: boolean }` |

El servidor también sirve `index.html` y los estáticos.

---

## 🔒 Seguridad
- El **Client ID/Secret** y el **access token** viven solo en el servidor.
- El navegador únicamente llama a `/api/search`; nunca ve las credenciales.
- El token se cachea en memoria y se renueva automáticamente al expirar.

## 🧩 Estructura
```
.
├── index.html        # La app (frontend de una sola página)
├── server.js         # Backend Express (auth + búsqueda)
├── package.json
├── .env.example      # Plantilla de credenciales
└── .gitignore
```
