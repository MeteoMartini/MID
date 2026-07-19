# METAR/WMO proxy

AviationWeather.gov blocks browser CORS. Deploy `metar-proxy.js` as a Cloudflare Worker (or equivalent serverless function) and set `VITE_METAR_PROXY_URL` during the Vite build. MID then compares Bright-Sky/DWD observations with nearby worldwide METAR/WMO airport observations and selects the best station using distance plus elevation difference.
