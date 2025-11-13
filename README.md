# listen_client_v3 – Voice Agent (MCP Orchestrator + ElevenLabs + Flask)

This app:

1. Records audio in the browser
2. Sends it to the Flask backend
3. Uses OpenAI Whisper (STT) to transcribe speech
4. Sends text to your MCP Orchestrator (`/orchestrate`)
5. Uses ElevenLabs TTS to convert reply_text to audio
6. Plays the reply audio in the browser
7. Supports optional hands-free mode (auto listen → reply → listen)

## Running locally

```bash
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# fill in your keys and URLs

python app.py
```

Then open http://localhost:5000

## Deploying on Railway

1. Push this repo (`listen_client_v3`) to GitHub
2. In Railway, create a new project from this repo
3. In the service's **Variables**, add:

- `OPENAI_API_KEY`
- `ORCHESTRATOR_URL`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID`

4. Deploy. Railway will use the `Procfile`:

```text
web: gunicorn app:app --bind 0.0.0.0:$PORT
```
