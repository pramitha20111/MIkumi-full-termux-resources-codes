#!/usr/bin/env python3
"""
MIKUMI 3D OMEGA v5.0 — STUDIO HUMAN VOICE + MULTIMODAL GEMINI + .VRMA + HTTP 206 SERVER
Supports:
  - Full RFC-7233 HTTP 206 Byte-Range streaming (.apk, .zip, .vrm, .vrma, .glb, .mp3)
  - Real-Time Studio Human Girl Neural Voice (/api/tts -> si-LK-ThiliniNeural & en-US-AnaNeural MP3)
  - Pre-Warmed Zero-Key Gemini Frontier Knowledge + Multimodal Vision Engine (/api/chat)
"""

import asyncio
import base64
from collections import OrderedDict
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
import hashlib
import hmac
import urllib.request
import xml.etree.ElementTree as ET
import re
import threading
import urllib.parse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CANDIDATE_WWW = os.path.join(SCRIPT_DIR, "app/src/main/assets/www")
ALT_WWW = "/home/user/Mikumi-Termux-Project/app/src/main/assets/www"

if os.path.isdir(CANDIDATE_WWW):
    SERVE_ROOT = CANDIDATE_WWW
elif os.path.isdir(ALT_WWW):
    SERVE_ROOT = ALT_WWW
else:
    SERVE_ROOT = SCRIPT_DIR

os.chdir(SERVE_ROOT)

TTS_CACHE = OrderedDict()
MAX_TTS_CACHE = 80

try:
    import edge_tts
    HAS_EDGE_TTS = True
except Exception:
    HAS_EDGE_TTS = False

try:
    import g4f
    HAS_G4F = True
except Exception:
    HAS_G4F = False


def prewarm_frontier_brain():
    if not HAS_G4F:
        return
    try:
        g4f.ChatCompletion.create(
            model="",
            provider=g4f.Provider.Gemini,
            messages=[{"role": "user", "content": "Hi"}],
        )
        print("[Mikumi v5.0] Frontier Gemini Flash pre-warmed & ready!")
    except Exception as exc:
        print(f"[Mikumi v5.0] Warmup note: {exc}")


async def synthesize_human_girl_mp3(text: str, voice: str, emotion: str = "neutral", intensity: float = 0.55) -> bytes:
    allowed = {
        "si-LK-ThiliniNeural",
        "en-US-AnaNeural",
        "en-US-AvaMultilingualNeural",
        "ja-JP-NanamiNeural",
    }
    selected = voice if voice in allowed else "si-LK-ThiliniNeural"
    # Emotion-aware prosody on the Sinhala neural voice: conservative pitch/rate shifts
    # preserve intelligibility while giving each reply a warmer, more expressive contour.
    level = max(0.0, min(1.0, float(intensity)))
    presets = {
        "happy": (4, 7), "playful": (7, 10), "shy": (1, -2),
        "tender": (-3, -3), "relaxed": (-5, -7), "sad": (-8, -12),
        "thinking": (-2, -4), "surprised": (8, 5), "angry": (3, 2),
        "wink": (5, 6), "neutral": (0, 0)
    }
    pitch_delta, rate_delta = presets.get(emotion, presets["neutral"])
    base_pitch = 3 if selected == "si-LK-ThiliniNeural" else 1
    base_rate = 2
    pitch = f"{round(base_pitch + pitch_delta * level):+d}Hz"
    rate = f"{round(base_rate + rate_delta * level):+d}%"

    comm = edge_tts.Communicate(text=text, voice=selected, rate=rate, pitch=pitch)
    chunks = bytearray()
    async for chunk in comm.stream():
        if chunk.get("type") == "audio":
            chunks.extend(chunk["data"])
    return bytes(chunks)


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "MikumiAssistant/5.3"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_live_weather(city: str = "Negombo"):
    geo = fetch_json("https://geocoding-api.open-meteo.com/v1/search?name=" + urllib.parse.quote(city) + "&count=1&language=en&format=json")
    locs = geo.get("results") or []
    if not locs:
        raise ValueError("Location not found")
    loc = locs[0]
    q = urllib.parse.urlencode({"latitude": loc["latitude"], "longitude": loc["longitude"], "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m", "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max", "timezone": "Asia/Colombo", "forecast_days": 1})
    weather = fetch_json("https://api.open-meteo.com/v1/forecast?" + q)
    return {"place": f"{loc.get('name', city)}, {loc.get('country', 'Sri Lanka')}", "current": weather.get("current", {}), "daily": weather.get("daily", {})}


def get_sri_lanka_news():
    url = "https://news.google.com/rss/search?q=Sri+Lanka&hl=en-US&gl=LK&ceid=LK:en"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 MikumiAssistant/5.3"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        root = ET.fromstring(resp.read())
    items = []
    for item in root.findall("./channel/item")[:8]:
        items.append({"title": item.findtext("title", ""), "link": item.findtext("link", ""), "published": item.findtext("pubDate", "")})
    return items


def whatsapp_ready():
    return all(os.environ.get(k) for k in ("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET"))


def send_whatsapp_text(to_number: str, text: str):
    token = os.environ["WHATSAPP_ACCESS_TOKEN"]
    phone_id = os.environ["WHATSAPP_PHONE_NUMBER_ID"]
    version = os.environ.get("WHATSAPP_GRAPH_VERSION", "v26.0")
    payload = json.dumps({"messaging_product": "whatsapp", "recipient_type": "individual", "to": to_number, "type": "text", "text": {"preview_url": False, "body": text[:4000]}}).encode()
    req = urllib.request.Request(f"https://graph.facebook.com/{version}/{phone_id}/messages", data=payload, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def answer_whatsapp_text(user_text: str) -> str:
    prompt = "You are Mikumi, a warm AI companion. Reply naturally and concisely in Sri Lankan Sinhala if the user writes Sinhala/Singlish, otherwise English. Be transparent that you are an AI; never claim to be a real human. Use a gentle caring tone, a relevant emotion, and occasional tasteful emojis. Ask permission before suggesting or invoking actions."
    if HAS_G4F:
        try:
            answer = g4f.ChatCompletion.create(model="", provider=g4f.Provider.Gemini, messages=[{"role": "system", "content": prompt}, {"role": "user", "content": user_text[:3000]}])
            if answer and str(answer).strip():
                return str(answer).strip()[:3500]
        except Exception as exc:
            print(f"[WhatsApp AI] {exc}")
    return "මට මේ මොහොතේ AI සේවාවට සම්බන්ධ වෙන්න බැරි වුණා. ටිකකින් ආයෙත් උත්සාහ කරමු 💛"


class FastThreadingServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class MikumiOmegaHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".apk": "application/vnd.android.package-archive",
        ".zip": "application/zip",
        ".vrm": "model/gltf-binary",
        ".vrma": "model/gltf-binary",
        ".glb": "model/gltf-binary",
        ".mp3": "audio/mpeg",
        ".webp": "image/webp",
        ".json": "application/json",
        ".js": "application/javascript",
    }

    def translate_path(self, path):
        clean = urllib.parse.urlparse(path).path
        base = os.path.basename(clean)
        if base in (
            "Mikumi-3D-Omega-v5.0.apk",
            "Mikumi-3D-Omega-v4.0.apk",
            "Mikumi-3D-Termux-Full-Source.zip",
        ):
            target_name = "Mikumi-3D-Omega-v5.0.apk" if base.endswith(".apk") else base
            for folder in ("/home/user", SCRIPT_DIR, SERVE_ROOT):
                cand = os.path.join(folder, target_name)
                if os.path.isfile(cand):
                    return cand
        return super().translate_path(path)

    def end_headers(self):
        clean_path = urllib.parse.urlparse(self.path).path
        if clean_path.endswith(".apk"):
            fname = os.path.basename(clean_path)
            self.send_header("Content-Disposition", f'attachment; filename="{fname}"')
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Range")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/api/whatsapp/status":
                payload = json.dumps({"configured": whatsapp_ready(), "mode": "official-cloud-api"}, ensure_ascii=False).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return

            if parsed.path == "/api/weather":
                city = urllib.parse.parse_qs(parsed.query).get("city", ["Negombo"])[0][:60]
                try:
                    payload = json.dumps(get_live_weather(city), ensure_ascii=False).encode()
                    status = 200
                except Exception as exc:
                    payload = json.dumps({"error": str(exc)}, ensure_ascii=False).encode()
                    status = 502
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return

            if parsed.path == "/api/news/lk":
                try:
                    payload = json.dumps({"items": get_sri_lanka_news()}, ensure_ascii=False).encode()
                    status = 200
                except Exception as exc:
                    payload = json.dumps({"error": str(exc)}, ensure_ascii=False).encode()
                    status = 502
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return

            if parsed.path == "/webhook/whatsapp":
                params = urllib.parse.parse_qs(parsed.query)
                configured_verify = os.environ.get("WHATSAPP_VERIFY_TOKEN", "")
                if (configured_verify and params.get("hub.mode", [""])[0] == "subscribe" and params.get("hub.verify_token", [""])[0] == configured_verify):
                    body = params.get("hub.challenge", [""])[0].encode()
                    self.send_response(200)
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                else:
                    self.send_error(403)
                return

            if parsed.path == "/api/tts":
                params = urllib.parse.parse_qs(parsed.query)
                text = (params.get("text", [""])[0] or "").strip()[:360]
                voice = (params.get("voice", ["si-LK-ThiliniNeural"])[0] or "si-LK-ThiliniNeural").strip()
                emotion = (params.get("emotion", ["neutral"])[0] or "neutral").strip().lower()
                try:
                    intensity = max(0.0, min(1.0, float(params.get("intensity", ["0.55"])[0])))
                except (TypeError, ValueError):
                    intensity = 0.55
                if not text or not HAS_EDGE_TTS:
                    self.send_response(404)
                    self.end_headers()
                    return

                cache_key = f"{voice}::{emotion}::{intensity:.2f}::{text}"
                audio_bytes = TTS_CACHE.get(cache_key)
                if audio_bytes is None:
                    try:
                        audio_bytes = asyncio.run(synthesize_human_girl_mp3(text, voice, emotion, intensity))
                        if audio_bytes:
                            TTS_CACHE[cache_key] = audio_bytes
                            if len(TTS_CACHE) > MAX_TTS_CACHE:
                                TTS_CACHE.popitem(last=False)
                    except Exception as exc:
                        print(f"[TTS Error] {exc}")
                        audio_bytes = b""

                if audio_bytes:
                    self.send_response(200)
                    self.send_header("Content-Type", "audio/mpeg")
                    self.send_header("Content-Length", str(len(audio_bytes)))
                    self.end_headers()
                    self.wfile.write(audio_bytes)
                    return

                self.send_response(502)
                self.end_headers()
                return

            range_hdr = self.headers.get("Range")
            local_file = self.translate_path(parsed.path)
            if range_hdr and os.path.isfile(local_file):
                m = re.match(r"bytes=(\d+)-(\d*)", range_hdr)
                if m:
                    file_size = os.path.getsize(local_file)
                    start = int(m.group(1))
                    end = int(m.group(2)) if m.group(2) else file_size - 1
                    end = min(end, file_size - 1)
                    if 0 <= start <= end < file_size:
                        length = end - start + 1
                        ctype = self.guess_type(local_file)
                        self.send_response(206)
                        self.send_header("Content-Type", ctype)
                        self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
                        self.send_header("Content-Length", str(length))
                        self.end_headers()
                        with open(local_file, "rb") as f:
                            f.seek(start)
                            remaining = length
                            while remaining > 0:
                                chunk = f.read(min(65536, remaining))
                                if not chunk:
                                    break
                                self.wfile.write(chunk)
                                remaining -= len(chunk)
                        return

            return super().do_GET()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_POST(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/webhook/whatsapp":
                length = int(self.headers.get("Content-Length", "0"))
                raw = self.rfile.read(length)
                secret = os.environ.get("WHATSAPP_APP_SECRET", "").encode()
                signature = self.headers.get("X-Hub-Signature-256", "")
                expected = "sha256=" + hmac.new(secret, raw, hashlib.sha256).hexdigest() if secret else ""
                if not secret or not hmac.compare_digest(signature, expected):
                    self.send_error(401)
                    return
                try:
                    event = json.loads(raw.decode("utf-8", errors="replace"))
                    for entry in event.get("entry", []):
                        for change in entry.get("changes", []):
                            value = change.get("value", {})
                            for msg in value.get("messages", []):
                                if msg.get("type") != "text":
                                    continue
                                sender = msg.get("from", "")
                                text_in = msg.get("text", {}).get("body", "").strip()
                                if sender and text_in and whatsapp_ready():
                                    reply = answer_whatsapp_text(text_in)
                                    send_whatsapp_text(sender, reply)
                except Exception as exc:
                    print(f"[WhatsApp webhook] {exc}")
                self.send_response(200)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return

            if parsed.path == "/api/chat":
                length = int(self.headers.get("Content-Length", "0"))
                raw = self.rfile.read(length).decode("utf-8", errors="replace")
                try:
                    body = json.loads(raw)
                    messages = body.get("messages", [])
                    image_data = body.get("image")
                except Exception:
                    messages = []
                    image_data = None

                reply_text = ""
                if HAS_G4F and messages:
                    try:
                        kwargs = {
                            "model": "",
                            "provider": g4f.Provider.Gemini,
                            "messages": messages,
                        }
                        if image_data and "," in image_data:
                            b64 = image_data.split(",", 1)[1]
                            img_bytes = base64.b64decode(b64)
                            kwargs["images"] = [[io.BytesIO(img_bytes), "photo.jpg"]]
                        ans = g4f.ChatCompletion.create(**kwargs)
                        if ans and str(ans).strip():
                            reply_text = str(ans).strip()
                    except Exception as exc:
                        print(f"[Brain Error] {exc}")

                payload = json.dumps({"reply": reply_text}, ensure_ascii=False).encode("utf-8")
                self.send_response(200 if reply_text else 502)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return

            self.send_response(404)
            self.end_headers()
        except (BrokenPipeError, ConnectionResetError):
            pass


if __name__ == "__main__":
    threading.Thread(target=prewarm_frontier_brain, daemon=True).start()
    print("⚡ Mikumi 3D Omega v5.0 Studio Server live on http://0.0.0.0:8080")
    FastThreadingServer(("0.0.0.0", 8080), MikumiOmegaHandler).serve_forever()
