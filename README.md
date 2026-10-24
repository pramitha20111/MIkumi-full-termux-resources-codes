# 🤍 Mikumi 3D Omega v3.0 — RedMagic Mora Pro Max Edition

Built specifically for **White Nothing Phone (3a)** (`Nothing OS 3.1 • Android 14/15`).

## ✨ New Flagship Upgrades in v3.0 Omega
1. **Real Human Cute Girl Voice (`si-LK-ThiliniNeural` + `en-US-AnaNeural`) — Zero Choppy Words!**
   - Smooth, natural Sri Lankan & English human girl neural voice (`audio/*.mp3` instant studio clips + gapless pre-buffered `NeuralVoiceEngine.java` + full `mikumi_turbo_server.py` studio voice streaming) paired with **real-time WebAudio formant 3D lip-sync (`aa` / `ih` / `oh`)**!
2. **Smart Voice ON / Voice OFF Dual Output Mode**:
   - **🔊 Voice ON**: Mikumi answers aloud in her natural human girl voice!
   - **🔇 Voice OFF**: Stays 100% silent (won't interrupt Reels/Music/Class!) and sends sleek **Floating Text Notification Messages** instead!
3. **1-Tap Hideable / Collapsible On-Screen Controls (`✕` & `⛶ CLEAN`)**:
   - Slide the floating screen-edge Voice + Chat pill completely off screen into a tiny edge tab anytime (`✕` / `‹`), or tap `⛶ CLEAN` for full-screen pure 3D Mora Showcase!
4. **RedMagic Mora Inspired Holographic 3D FX & Time Greetings**:
   - Counter-rotating holographic cyber magic rings on the floor, 85-particle floating GPU 3D energy aura, shockwave bursts on touch, and instant **☀️ Good Morning / 🌤️ Good Afternoon / 🌆 Good Evening / 🌙 Good Night** greetings!
5. **Live Reels & Screen Companion Reader + Permission-Gated Safe Phone Control**:
   - Automatically watches Reels / TikTok / YouTube Shorts on screen and reacts live!
   - When authorized in **Settings -> Allow Phone Command Execution**, opens apps (`Open Instagram`, `Open WhatsApp`), searches YouTube/Google, sets Alarms/Timers, sends safe chat messages, and runs 0% battery Master OFF!

## 🚀 Build or Run Turbo Human Voice Daemon in Termux
```bash
pkg update -y && pkg install -y unzip python
unzip ~/storage/downloads/Mikumi-3D-Termux-Full-Source.zip -d ~/Mikumi3DOmega
cd ~/Mikumi3DOmega

# Optional 1-command local Studio Voice + Pre-Warmed Gemini 3.6 Flash Daemon:
pip install edge-tts g4f aiohttp beautifulsoup4
python mikumi_turbo_server.py &

# Or rebuild your own customized .vrm APK directly on phone:
bash build_in_termux.sh
```
