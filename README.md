# Exam Checker

Camera-first Expo app + FastAPI backend. Photograph an exam paper → OCR → auto audit (spelling/grammar + answer key) → teacher rates handwriting only for final marks.

## Quick start (demo mode — works without API keys)

**Terminal 1 — API**
```bash
chmod +x scripts/start-api.sh scripts/start-mobile.sh
./scripts/start-api.sh
```

**Terminal 2 — Mobile**
```bash
./scripts/start-mobile.sh
```

Scan the QR code with **Expo Go** from the Play/App Store.

This project targets **Expo SDK 54** — that matches the store Expo Go version (`expoGoSdkVersion: 54`). SDK 56/57 will not open on current store Expo Go.

Mobile start uses **tunnel mode** by default (works when Wi‑Fi blocks phone↔PC).  
For faster LAN: `EXPO_USE_LAN=1 ./scripts/start-mobile.sh`

Default mode uses **mock OCR** so you can demo offline. Health: `http://YOUR_LAN_IP:8001/health`

### Phone shows “API offline”?

Expo tunnel loads the app UI, but the phone often **cannot** reach `http://YOUR_LAN_IP:8001` (Wi‑Fi client isolation).

1. Keep API running: `./scripts/start-api.sh`
2. In a **third** terminal, expose the API:
   ```bash
   ./scripts/start-api-tunnel.sh
   ```
3. Restart Expo (`Ctrl+C` then `./scripts/start-mobile.sh`) and scan the QR again.

The tunnel script writes a public `https://….loca.lt` URL into `apps/mobile/.env`.

## Enable real OCR + AI grading (free)

1. Get a free key at [console.groq.com](https://console.groq.com/)
2. Edit `services/api/.env`:

```
MOCK_OCR=false
MOCK_GRADE=false
OCR_PROVIDER=hf_space
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
HF_TOKEN=optional_huggingface_token
```

3. Restart the API.

- **Grading** uses Groq (`GROQ_MODEL`)
- **OCR** uses [Unlimited-OCR HF Space](https://huggingface.co/spaces/baidu/Unlimited-OCR), with **Groq vision** as fallback
- Self-host OCR later: `OCR_PROVIDER=self_host` and `OCR_BASE_URL=http://127.0.0.1:10000`

## Manual commands

```bash
# API
cd services/api
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Mobile
cd apps/mobile
npm install
npx expo start
```

## App flow

1. Create exam → optional answer key  
2. Capture one or more pages  
3. Wait for OCR + grading  
4. Review Photos / OCR (editable + re-grade) / Issues  
5. Enter marks → save  

## Layout

```
apps/mobile/       Expo React Native
services/api/      FastAPI + SQLite
scripts/           start-api.sh · start-mobile.sh
```
# Exam-Checker
