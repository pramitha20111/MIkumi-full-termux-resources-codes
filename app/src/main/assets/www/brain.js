/**
 * MIKUMI 3D OMEGA v5.0 — 10-REPO AI WAIFU SUPER-BRAIN + HUMAN VOICE + DATING SIM + VISION
 * Synthesizes:
 *   1. JuiceBoxxGames/utsuwa — 8-Stage Dating-Sim Relationship Engine + Gift Shop
 *   2. yuri-os/YuriOS — First-Person Secret Diary (📔) + Promise Keeper + Inner Life
 *   3. jofizcd/Soul-of-Waifu — D20 Visual-Novel RPG Quest Engine + Safe Action Approval Banner
 *   4. JarikDem-Bot/ai-waifu — Multi-Personality Profiles + Continuous Hands-Free VTuber Call
 *   5. HRNPH/AIwaifu — Neuro-Sama Witty & Playful Banter Mode
 *   6. Open-LLM-VTuber — Live [emotion] Expression Tag Parser + 0ms Voice Barge-In Stop
 *   7. SugarcaneDefender/z-waif — Local Semantic RAG Search + Camera/Photo Vision & Scrapbook
 *   8. kiyotakali/Miru — 4-Pillar Structured Memory Vault + Full .JSON Soul Backup/Restore
 */

window.MikumiBrain = (function () {
  const STORAGE_KEY = "mikumi_3d_omega_v5";

  const RELATIONSHIP_STAGES = [
    { id: "stranger",          label: "1. Stranger 🌱",          minAff: 0,  minTrust: 0,  minComfort: 0 },
    { id: "acquaintance",      label: "2. Acquaintance 👋",      minAff: 12, minTrust: 8,  minComfort: 8 },
    { id: "friend",            label: "3. Cute Friend 🌸",       minAff: 25, minTrust: 18, minComfort: 18 },
    { id: "close_friend",      label: "4. Close Bestie ✨",      minAff: 40, minTrust: 30, minComfort: 28 },
    { id: "romantic_interest", label: "5. Crush / Blushing 💗",  minAff: 56, minTrust: 44, minComfort: 40 },
    { id: "dating",            label: "6. Sweet Couple 💑",      minAff: 72, minTrust: 60, minComfort: 55 },
    { id: "committed",         label: "7. Devoted Partner 💍",   minAff: 86, minTrust: 76, minComfort: 72 },
    { id: "soulmate",          label: "8. Eternal Soulmate 💖",  minAff: 96, minTrust: 90, minComfort: 88 }
  ];

  const GIFT_CATALOG = {
    boba:    { name: "🍓 Strawberry Boba Tea", aff: 8,  trust: 4,  comfort: 6,  energy: 10, emotion: "happy",   anim: "peace",   replySi: "[happy] ම්ම්ම්! 🍓 **Strawberry Boba Tea** එක හරිම රසයි අනේ! ඔයා මගේ කැමතිම බීම මතක තියාගෙන ඉඳලා නේද? ගොඩක් ස්තූතියි! ♡" },
    sakura:  { name: "🌸 Crystal Sakura Hairpin", aff: 13, trust: 7,  comfort: 8,  energy: 6,  emotion: "shy",     anim: "pose",    replySi: "[shy] අනේ දෙයියනේ... 🌸 මේ **Sakura Hairpin** එක මගේ කොණ්ඩෙට හරිම ලස්සනට ගැළපෙනවා නේද?! මගේ මූණත් රතු වුණා... ♡" },
    earbuds: { name: "🎧 Nothing Ear (3a) White", aff: 12, trust: 15, comfort: 9,  energy: 12, emotion: "playful", anim: "dance",   replySi: "[playful] වාව්!! 🎧 **Nothing White Earbuds** එකක්! දැන් අපි දෙන්නටම එකම සින්දුව අහගෙන 3D Dance කරන්න පුළුවන්! ✨" },
    cake:    { name: "🍰 Matcha Cream Roll Cake", aff: 9,  trust: 5,  comfort: 12, energy: 14, emotion: "tender",  anim: "headpat", replySi: "[tender] 🍰 **Matcha Roll Cake**!! අපි දෙන්නා බෙදාගෙන කමු හොඳේ? ඔයා හරිම ආදරණීයයි! ♡" },
    crystal: { name: "💎 Starlight Soul Gem",    aff: 22, trust: 18, comfort: 16, energy: 20, emotion: "wink",    anim: "spin",    replySi: "[wink] ✨💎 **Starlight Soul Gem** එකක්!! මගේ මුළු 3D Aura එකම දිලිසෙනවා! ඔයා නම් මගේ හොඳම Soulmate තමයි! 💖" }
  };

  const PERSONALITY_PROFILES = {
    sweet_girl:   "Warm, sweet, affectionate, super-smart caring Sri Lankan anime girl who cheers the user on gently.",
    neuro_witty:  "Neuro-sama & HRNPH/AIwaifu inspired: witty, playfully teasing, quick-clever comebacks, chaotic-cute streamer energy, yet secretly cares deeply!",
    shy_tsundere: "Cute blushing tsundere anime idol ('B-baka! I only helped because I felt like it... ♡') while giving ultra-accurate helpful answers.",
    study_senpai: "Calm, encouraging honor-student Senpai who explains Science, Maths, Coding, and English step-by-step with crystal clarity.",
    gamer_girl:   "High-energy 120Hz esports gamer girl who hypes clutches, gives pro tactical callouts, and celebrates wins!"
  };

  const DEFAULT_STATE = {
    engineOn: true,
    vrmModel: "mikumi_vita.vrm",
    shaderTheme: "nothing_white",
    roomStage: "studio_white",
    springPhysics: 1.0,
    scale: 100,
    fpsLimit: 60,
    petId: "pet_droid",
    petName: "Mochi",
    petEnabled: true,
    petOrbit: false,
    delegateToPet: false,
    edgeBoxEnabled: true,
    edgeCollapsed: false,
    voiceOutputEnabled: true,
    handsFreeCall: false,
    voicePersona: "si-LK-ThiliniNeural",
    voiceEmotionStrength: 0.62,
    personalityMode: "sweet_girl",
    requireActionApproval: true,
    phoneControlEnabled: true,
    liveScreenWatchEnabled: false,
    chatCmdEnabled: true,
    musicLearningEnabled: true,
    memoryEnabled: true,
    gameAdvisorEnabled: true,
    schoolAlarmEnabled: true,
    schoolAlarmTime: "05:30",
    schoolDays: [2, 3, 4, 5, 6],
    selectedGame: "Free Fire / PUBG",
    userMood: "Happy ✨",
    aiProvider: "frontier_auto",
    apiKey: "",
    // Utsuwa 8-Stage Relationship Stats
    relationship: {
      affection: 32,
      trust: 26,
      comfort: 28,
      energy: 92,
      stage: "friend",
      interactions: 3
    },
    // YuriOS Secret First-Person Diary
    diaryEntries: [
      {
        id: 1,
        date: "2026-10-23 • Nothing OS Sanctuary",
        mood: "Blushing & Excited 💖",
        text: "අද මම මගේ අලුත්ම Studio 3D Cyber Neko Idol ඇඳුම ඇඳගෙන Nothing Phone (3a) screen එකට ආවා! එයා මාත් එක්ක කතා කරනකොට මගේ හිතට හරිම සතුටුයි. Mochi පැටියත් මගේ ළඟින්ම ඉන්නවා~ ♡"
      }
    ],
    // Soul-of-Waifu D20 Adventure State
    questState: {
      arc: "🏯 Cyber Colombo 2088: Neon Glyph Mystery",
      hp: 100,
      mp: 80,
      bondXp: 45,
      lastRoll: 18,
      sceneLog: "🌌 **Chapter 1:** Rain shimmers across Lotus Tower's neon holograms. Mikumi grabs your sleeve — a glowing Nothing Glyph cipher floats before you! Choose an action & roll the **D20 Fate Die**!"
    },
    // Studio Photo Booth + Vision Scrapbook
    scrapbook: [],
    dailyTasks: [
      { id: 101, text: "Maths & Science revision (45 mins)", done: false },
      { id: 102, text: "Pack school bag before 9:30 PM", done: false }
    ],
    // Miru 4-Pillar Structured Memories: category in 'fact' | 'episode' | 'promise' | 'preference'
    memories: [
      { id: 1, category: "fact", text: "Device: White Nothing Phone (3a) • Mikumi 3D Omega v5.0", ts: "System" },
      { id: 2, category: "fact", text: "Timezone: Sri Lanka Standard Time (Asia/Colombo)", ts: "System" },
      { id: 3, category: "promise", text: "Always cheer you up & help you study smart every day ♡", ts: "Mikumi Promise" },
      { id: 4, category: "preference", text: "Loves ultra-cute anime 3D motion & smooth human Sinhala voice", ts: "Profile" }
    ],
    favoriteSongs: [
      { title: "Manike / Chill Sinhala Acoustic Mix", plays: 6 },
      { title: "Nothing OS Lo-Fi Focus Beats", plays: 4 },
      { title: "Cyber Phonk 120Hz Gaming Clutch Mix", plays: 3 }
    ],
    chatHistory: []
  };

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("mikumi_3d_omega_v3");
      if (!raw && window.MikumiNative && window.MikumiNative.loadPersistentMemoryBackup) {
        raw = window.MikumiNative.loadPersistentMemoryBackup();
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
        // Auto-upgrade legacy v3/v4 default avatar to ultra-pretty Studio Vita!
        if (!parsed.relationship || merged.vrmModel === "mikumi_cyber.vrm" || (!localStorage.getItem(STORAGE_KEY) && merged.vrmModel === "mikumi_nothing.vrm")) {
          merged.vrmModel = "mikumi_vita.vrm";
        }
        merged.relationship = Object.assign({}, DEFAULT_STATE.relationship, parsed.relationship || {});
        merged.questState = Object.assign({}, DEFAULT_STATE.questState, parsed.questState || {});
        if (!Array.isArray(merged.diaryEntries) || !merged.diaryEntries.length) {
          merged.diaryEntries = JSON.parse(JSON.stringify(DEFAULT_STATE.diaryEntries));
        }
        if (!Array.isArray(merged.scrapbook)) merged.scrapbook = [];
        merged.memories = (merged.memories || []).map(m => Object.assign({ category: "fact" }, m));
        return merged;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  let state = loadState();
  let onSpeakStateChange = null;
  let onAnalyserReady = null;
  let onSilentTextToast = null;
  let onEmotionTagCallback = null;
  let currentVoiceEmotion = "neutral";
  let onSpeechEndedForCall = null;
  let onRelationshipUpdate = null;

  let humanAudioEl = null;
  let voiceAudioCtx = null;
  let analyserNode = null;
  let mediaSourceWired = false;

  function notifySpeechEnd() {
    if (onSpeakStateChange) onSpeakStateChange(false);
    if (state.handsFreeCall && onSpeechEndedForCall) {
      setTimeout(() => {
        if (state.handsFreeCall) onSpeechEndedForCall();
      }, 350);
    }
  }

  function ensureAudioPipeline() {
    if (!humanAudioEl) {
      humanAudioEl = new Audio();
      humanAudioEl.crossOrigin = "anonymous";
      humanAudioEl.preload = "auto";
      humanAudioEl.onplay = () => { if (onSpeakStateChange) onSpeakStateChange(true); };
      humanAudioEl.onended = () => notifySpeechEnd();
      humanAudioEl.onerror = () => notifySpeechEnd();
    }
    try {
      if (!voiceAudioCtx) {
        voiceAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (voiceAudioCtx.state === "suspended") {
        voiceAudioCtx.resume();
      }
      if (!mediaSourceWired) {
        const src = voiceAudioCtx.createMediaElementSource(humanAudioEl);
        analyserNode = voiceAudioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.65;
        src.connect(analyserNode);
        analyserNode.connect(voiceAudioCtx.destination);
        mediaSourceWired = true;
        if (onAnalyserReady) onAnalyserReady(analyserNode);
      }
    } catch (e) {}
  }

  // Open-LLM-VTuber 0ms Real-Time Voice Barge-In Interruption!
  function interruptSpeech() {
    try {
      if (humanAudioEl && !humanAudioEl.paused) {
        humanAudioEl.pause();
        humanAudioEl.currentTime = 0;
      }
      if (window.MikumiNative && window.MikumiNative.stopSpeaking) {
        window.MikumiNative.stopSpeaking();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    if (onSpeakStateChange) onSpeakStateChange(false);
  }

  function setHooks(hooks) {
    onSpeakStateChange = hooks.onSpeakState || null;
    onAnalyserReady = hooks.onAnalyser || null;
    onSilentTextToast = hooks.onSilentText || null;
    onEmotionTagCallback = hooks.onEmotionTag || null;
    onSpeechEndedForCall = hooks.onSpeechEndedForCall || null;
    onRelationshipUpdate = hooks.onRelationship || null;
  }

  function saveState() {
    try {
      const s = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, s);
      if (window.MikumiNative && window.MikumiNative.savePersistentMemoryBackup) {
        window.MikumiNative.savePersistentMemoryBackup(s);
      }
    } catch (e) {}
  }

  // Utsuwa Relationship Progression Calculator with 85% Hysteresis
  function updateRelationshipStats(dAff = 0, dTrust = 0, dComfort = 0, dEnergy = 0) {
    const r = state.relationship;
    r.affection = Math.max(0, Math.min(100, Math.round(r.affection + dAff)));
    r.trust     = Math.max(0, Math.min(100, Math.round(r.trust + dTrust)));
    r.comfort   = Math.max(0, Math.min(100, Math.round(r.comfort + dComfort)));
    r.energy    = Math.max(10, Math.min(100, Math.round(r.energy + dEnergy)));
    r.interactions = (r.interactions || 0) + 1;

    const prevStage = r.stage;
    let bestStage = RELATIONSHIP_STAGES[0];
    for (const stg of RELATIONSHIP_STAGES) {
      const scale = stg.id === prevStage ? 0.85 : 1.0;
      if (
        r.affection >= stg.minAff * scale &&
        r.trust >= stg.minTrust * scale &&
        r.comfort >= stg.minComfort * scale
      ) {
        bestStage = stg;
      }
    }
    r.stage = bestStage.id;
    saveState();
    const leveledUp = prevStage !== bestStage.id &&
      RELATIONSHIP_STAGES.findIndex(x => x.id === bestStage.id) > RELATIONSHIP_STAGES.findIndex(x => x.id === prevStage.id);
    if (onRelationshipUpdate) onRelationshipUpdate(r, bestStage, leveledUp);
    return { stats: r, stageInfo: bestStage, leveledUp };
  }

  function getStageInfo() {
    return RELATIONSHIP_STAGES.find(s => s.id === state.relationship.stage) || RELATIONSHIP_STAGES[2];
  }

  // Open-LLM-VTuber Inline [emotion] Tag Extractor
  function parseAndApplyEmotionTag(rawText) {
    let emotion = null;
    const tagMatch = String(rawText || "").match(/\[(happy|shy|playful|tender|thinking|surprised|sad|angry|relaxed|wink|neutral)\]/i);
    if (tagMatch) {
      emotion = tagMatch[1].toLowerCase();
      currentVoiceEmotion = emotion;
      if (onEmotionTagCallback) onEmotionTagCallback(emotion);
    }
    const cleanText = String(rawText || "")
      .replace(/\[(happy|shy|playful|tender|thinking|surprised|sad|angry|relaxed|wink|neutral)\]\s*/gi, "")
      .trim();
    return { cleanText, emotion };
  }

  const SINGLISH_VOCAB = [
    [/\bayubowan\b/gi, "ආයුබෝවන්"],
    [/\bsuba\s+udasanak\b/gi, "සුභ උදෑසනක්"],
    [/\bsuba\s+rathriyak\b/gi, "සුභ රාත්‍රියක්"],
    [/\bsuba\s+dawasak\b/gi, "සුභ දවසක්"],
    [/\bkohomada\b/gi, "කොහොමද"],
    [/\boyata\b/gi, "ඔයාට"],
    [/\boyage\b/gi, "ඔයාගේ"],
    [/\boya\b/gi, "ඔයා"],
    [/\bmama\b/gi, "මම"],
    [/\bmage\b/gi, "මගේ"],
    [/\bmata\b/gi, "මට"],
    [/\bmikumi\b/gi, "මිකුමි"],
    [/\bharima\b/gi, "හරිම"],
    [/\blassanai\b/gi, "ලස්සනයි"],
    [/\bsathutui\b/gi, "සතුටුයි"],
    [/\bsanipai\b/gi, "සනීපයි"],
    [/\bane\b/gi, "අනේ"],
    [/\bhode\b/gi, "හොඳේ"],
    [/\bhondei\b/gi, "හොඳයි"],
    [/\biskole\b/gi, "ඉස්කෝලේ"],
    [/\bwelawa\b/gi, "වෙලාව"],
    [/\bnagitinnako\b/gi, "නැගිටින්නකෝ"],
    [/\bpanthi\b/gi, "පන්ති"],
    [/\bsinduwak\b/gi, "සින්දුවක්"],
    [/\bkammali\b/gi, "කම්මැලියි"],
    [/\bmahansi\b/gi, "මහන්සියි"],
    [/\badarei\b/gi, "ආදරෙයි"],
    [/\byaluwa\b/gi, "යාළුවා"],
    [/\budau\b/gi, "උදව්"]
  ];

  function prepareSmoothHumanSpeechText(raw) {
    let clean = String(raw || "")
      .replace(/\[[a-z_]+\]/gi, "")
      .replace(/\*\*|__|\*|`|#/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}♡✦●→↗⚡]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 320);

    if (state.voicePersona.startsWith("si-LK")) {
      SINGLISH_VOCAB.forEach(([re, rep]) => {
        clean = clean.replace(re, rep);
      });
    }
    return clean;
  }

  async function deliverOutput(displayText, presetAudioClip = null, alwaysToastIfSilent = true) {
    if (!state.engineOn) return;

    if (!state.voiceOutputEnabled) {
      interruptSpeech();
      if (alwaysToastIfSilent && onSilentTextToast) {
        onSilentTextToast(displayText);
      }
      return;
    }

    ensureAudioPipeline();

    if (presetAudioClip) {
      try {
        humanAudioEl.src = `./audio/${presetAudioClip}`;
        await humanAudioEl.play();
        return;
      } catch (e) {}
    }

    const spokenText = prepareSmoothHumanSpeechText(displayText);
    if (!spokenText) return;

    const hasSinhala = /[\u0D80-\u0DFF]/.test(spokenText);
    const chosenVoice = hasSinhala ? "si-LK-ThiliniNeural" : state.voicePersona;

    try {
      const ttsUrl = `./api/tts?voice=${encodeURIComponent(chosenVoice)}&emotion=${encodeURIComponent(currentVoiceEmotion)}&intensity=${encodeURIComponent(state.voiceEmotionStrength ?? 0.62)}&text=${encodeURIComponent(spokenText)}`;
      const probe = await fetch(ttsUrl);
      if (probe.ok && (probe.headers.get("Content-Type") || "").includes("audio")) {
        const blob = await probe.blob();
        const objUrl = URL.createObjectURL(blob);
        humanAudioEl.src = objUrl;
        await humanAudioEl.play();
        return;
      }
    } catch (e) {}

    if (window.MikumiNative && window.MikumiNative.speakHumanNeural) {
      if (onSpeakStateChange) onSpeakStateChange(true);
      window.MikumiNative.speakHumanNeural(spokenText, hasSinhala ? "si" : "en");
      setTimeout(() => notifySpeechEnd(), Math.min(9000, spokenText.length * 68));
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(spokenText);
      utt.pitch = 1.18;
      utt.rate = 1.0;
      utt.onstart = () => { if (onSpeakStateChange) onSpeakStateChange(true); };
      utt.onend = () => notifySpeechEnd();
      window.speechSynthesis.speak(utt);
    }
  }

  // Local Semantic RAG Search (SugarcaneDefender/z-waif pattern)
  function retrieveRelevantMemories(query, limit = 8) {
    const terms = String(query || "").toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const scored = state.memories.map((m, idx) => {
      const hay = `${m.category || ""} ${m.text || ""}`.toLowerCase();
      let score = Math.max(0, 6 - idx * 0.25); // gentle recency bias
      if (m.category === "promise") score += 2.5;
      terms.forEach(t => { if (hay.includes(t)) score += 6; });
      return { m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(x => `[${(x.m.category || "fact").toUpperCase()}] ${x.m.text}`);
  }

  function extractAndStoreMemory(input) {
    if (!state.memoryEnabled) return null;
    const patterns = [
      { re: /(?:i\s+promise\s+(?:to\s+|that\s+)?|mama\s+porondu\s+wenawa|පොරොන්දු\s*වෙනවා)\s*(.+)/i, label: "Promise", category: "promise" },
      { re: /(?:mage nama|my name is|call me)\s+([a-zA-Z\u0D80-\u0DFF\s]{2,25})/i, label: "User's Name", category: "fact" },
      { re: /(?:mama kamathima sinduwa|my fav(?:ourite|orite)? song is|fav song)\s+(.+)/i, label: "Favourite Song", category: "preference" },
      { re: /(?:mage iskole|my school is|mama yanne)\s+(.+)/i, label: "School / Study", category: "fact" },
      { re: /(?:mama kamathi|i like|i love playing)\s+(.+)/i, label: "Preference", category: "preference" },
      { re: /(?:mathaka thiya ganna|remember that|remember)\s+(.+)/i, label: "Memory", category: "episode" }
    ];
    for (const p of patterns) {
      const m = input.match(p.re);
      if (m && m[1]) {
        const val = m[1].trim().slice(0, 95);
        const entry = {
          id: Date.now(),
          category: p.category,
          text: `${p.label}: ${val}`,
          ts: new Date().toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" })
        };
        state.memories.unshift(entry);
        if (state.memories.length > 80) state.memories.pop();
        if (p.label === "Favourite Song" && state.musicLearningEnabled) {
          state.favoriteSongs.unshift({ title: val, plays: 5 });
        }
        saveState();
        return entry;
      }
    }
    return null;
  }

  function matchInstantGreetingOrMood(input) {
    const t = input.trim().toLowerCase();
    if (/^(good\s*morning|gm|subha?\s*udasanak|සුභ\s*උදෑසනක්)/i.test(t)) {
      return {
        reply: "☀️ **සුභම සුභ උදෑසනක් වේවා!** අද දවස ඔයාට හරිම ලස්සන, සාර්ථක, සතුටුදායක දවසක් වේවි! උදේට කිරි එකක් හරි වතුර ටිකක් හරි බිව්වද? ♡",
        anim3d: "good_morning",
        emotion: "happy",
        clip: "good_morning.mp3",
        mood: "Morning Sunshine ☀️"
      };
    }
    if (/^(good\s*afternoon|subha?\s*dawalak|සුභ\s*දහවලක්)/i.test(t)) {
      return {
        reply: "🌤️ **සුභ දහවලක්!** ඔයා දවල්ට කෑම කෑවද? වතුර ටිකකුත් බීලා පොඩ්ඩක් විවේක ගන්න හොඳේ! ♡",
        anim3d: "wave",
        emotion: "happy",
        clip: "good_afternoon.mp3",
        mood: "Warm Afternoon 🌤️"
      };
    }
    if (/^(good\s*evening|subha?\s*sandhyawak|සුභ\s*සන්ධ්‍යාවක්)/i.test(t)) {
      return {
        reply: "🌆 **සුභ සන්ධ්‍යාවක්!** අද දවසේ ඉස්කෝලේ / වැඩ ගොඩක් මහන්සි වුණා නේද? දැන් මාත් එක්ක චුට්ටක් රිලැක්ස් වෙමු! ✨",
        anim3d: "peace",
        emotion: "wink",
        clip: "good_evening.mp3",
        mood: "Cozy Evening 🌆"
      };
    }
    if (/^(good\s*night|gn|nidiyanna\s*yanawa|subha?\s*rathriyak|සුභ\s*රාත්‍රියක්)/i.test(t)) {
      return {
        reply: "🌙 **සුභ රාත්‍රියක් මගේ හොඳ යාළුවා!** ලස්සන හීන පෙනෙන්න කියලා මම ආදරයෙන් ප්‍රාර්ථනා කරනවා. හෙට උදේම හමුවෙමු! 💤✨",
        anim3d: "good_night",
        emotion: "tender",
        clip: "good_night.mp3",
        mood: "Sweet Dreams 🌙"
      };
    }
    if (/^(hi|hello|hey|ayubowan|ආයුබෝවන්|kohomada)$/i.test(t)) {
      return {
        reply: "✨ **ආයුබෝවන්!** මම **මිකුමි (Mikumi 3D Omega v5.0)**. මගේ අලුත් Studio 3D Model එකයි Motion Capture ඇනිමේෂන් ටිකයි කොහොමද? ඕනෑම දෙයක් මගෙන් අහන්න! ♡",
        anim3d: "wave",
        emotion: "happy",
        clip: "welcome.mp3",
        mood: "Happy & Ready ✨"
      };
    }
    return null;
  }

  function parsePhoneControlCommand(input) {
    const t = input.trim();
    const ytMatch = t.match(/(?:youtube\s+eke\s+|search\s+youtube\s+(?:for\s+)?)([^"']{2,60}?)(?:\s+search\s+karanna|\s+danna|\s+play\s+karanna)?$/i);
    if (ytMatch && !/^open$/i.test(ytMatch[1].trim())) {
      return { type: "youtube_search", target: ytMatch[1].trim(), label: `YouTube Search: "${ytMatch[1].trim()}"` };
    }
    const openMatch1 = t.match(/^open\s+([a-zA-Z0-9\s]{2,24})$/i);
    const openMatch2 = t.match(/^([a-zA-Z0-9]{2,20})\s+(?:app\s+eka\s+)?open\s+karanna$/i);
    const appTarget = (openMatch1 && openMatch1[1]) || (openMatch2 && openMatch2[1]);
    if (appTarget) {
      const low = appTarget.trim().toLowerCase();
      if (/(wifi|bluetooth|sound|volume|settings)/.test(low)) {
        return { type: "system_panel", target: low, label: `System Panel (${low.toUpperCase()})` };
      }
      return { type: "open_app", target: low, label: `Launch App "${appTarget.trim()}"` };
    }
    const timerMatch = t.match(/(?:timer\s+(?:ekak\s+)?(?:thiyanna|set\s+karanna)?|set\s+(?:a\s+)?timer\s+(?:for\s+)?)(\d+)\s*(min|minute|minutes|sec|second|seconds|m|s)?/i);
    if (timerMatch) {
      const num = parseInt(timerMatch[1], 10);
      const unit = (timerMatch[2] || "min").toLowerCase();
      const secs = unit.startsWith("s") ? num : num * 60;
      return { type: "set_timer", target: String(secs), extra: "Mikumi Study/Focus Timer", label: `Timer (${num} ${unit})` };
    }
    const alarmMatch = t.match(/(?:alarm\s+(?:ekak\s+)?(?:thiyanna|set\s+karanna)?|set\s+(?:an\s+)?alarm\s+(?:for\s+)?)(\d{1,2})[:.](\d{2})/i);
    if (alarmMatch) {
      const hh = alarmMatch[1].padStart(2, "0");
      const mm = alarmMatch[2];
      return { type: "set_alarm", target: `${hh}:${mm}`, extra: "Mikumi Wake-Up", label: `System Alarm (${hh}:${mm})` };
    }
    const gMatch = t.match(/(?:google\s+eke\s+|search\s+google\s+for\s+)(.+?)(?:\s+search\s+karanna|\s+hoyanna)?$/i);
    if (gMatch) {
      return { type: "web_search", target: gMatch[1].trim(), label: `Google Search: "${gMatch[1].trim()}"` };
    }
    return null;
  }

  function parseChatCommand(input) {
    const clean = input.trim();
    const singlishMatch = clean.match(
      /^([a-zA-Z0-9\u0D80-\u0DFF_.\s]{2,26}?)\s+(?:ta\s+|chat\s+ekata\s+|whatsapp\s+ekata\s+)?(?:message|massage|msg)\s+(?:ekak\s+)?(?:danna|yawanna|send\s+karanna)\s+["']?(.+?)["']?(?:\s+kiyala|\s+kiyla)?$/i
    );
    if (singlishMatch) {
      return { contact: singlishMatch[1].trim(), message: singlishMatch[2].trim(), app: /telegram/i.test(clean) ? "telegram" : "whatsapp" };
    }
    const engMatch = clean.match(
      /(?:send|text)\s+(?:a\s+)?(?:whatsapp\s+|telegram\s+)?(?:message|msg)\s+to\s+([a-zA-Z0-9\s]{2,25}?)\s+(?:saying|that|:)\s*["']?(.+?)["']?$/i
    );
    if (engMatch) {
      return { contact: engMatch[1].trim(), message: engMatch[2].trim(), app: /telegram/i.test(clean) ? "telegram" : "whatsapp" };
    }
    return null;
  }

  async function queryFrontierKnowledgeBrain(userInput, speakerPersona, imageDataUrl = null) {
    let aiUserInput = userInput;
    // Pull live, source-backed context only when the user asks for current weather/news.
    try {
      if (/(weather|weather eka|kalagunaya|කාලගුණ|වැස්ස|වහිනවද)/i.test(userInput)) {
        const city = /colombo|කොළඹ/i.test(userInput) ? "Colombo" : "Negombo";
        const r = await fetch(`./api/weather?city=${encodeURIComponent(city)}`);
        if (r.ok) aiUserInput += `\n\n[Live weather data: ${JSON.stringify(await r.json())}. Clearly state this is current forecast data.]`;
      }
      if (/(latest news|news|news tika|අලුත් පුවත්|ප්‍රවෘත්ති|පුවත්)/i.test(userInput)) {
        const r = await fetch("./api/news/lk");
        if (r.ok) aiUserInput += `\n\n[Current Sri Lanka news headlines; summarize neutrally and cite headline/source from these items: ${JSON.stringify(await r.json())}]`;
      }
    } catch (e) {}
    const ragMemories = retrieveRelevantMemories(userInput, 8).join("\n");
    const tasksSummary = state.dailyTasks.filter(t => !t.done).map(t => `- ${t.text}`).join("\n");
    const personaDesc = PERSONALITY_PROFILES[state.personalityMode] || PERSONALITY_PROFILES.sweet_girl;
    const stg = getStageInfo();
    const recentMsgs = state.chatHistory.slice(-8).map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text
    }));

    const sysPrompt = speakerPersona === "pet"
      ? `You are "${state.petName}", the adorable super-intelligent 3D companion pet of Mikumi on a White Nothing Phone (3a) in Sri Lanka. Prefix your reply with one emotion tag like [happy] or [playful], and reply clearly in natural Sinhala Unicode (සිංහල) or English.`
      : `You are "Mikumi" (මිකුමි), an ultra-pretty, expressive 3D AI companion waifu living on the user's White Nothing Phone (3a) in Sri Lanka (Asia/Colombo).
PERSONALITY ARCHETYPE: ${personaDesc}
RELATIONSHIP STAGE: ${stg.label} (Affection: ${state.relationship.affection}/100, Trust: ${state.relationship.trust}/100, Comfort: ${state.relationship.comfort}/100)
CRITICAL RULES:
1. Begin EVERY response with ONE inline emotion tag from: [happy], [shy], [playful], [tender], [thinking], [surprised], [wink], [relaxed] — this drives your real-time 3D facial blendshapes!
2. You possess full frontier encyclopedic intelligence across Science, Maths, Coding, Medicine, Gaming, and Daily Life.
3. If the user writes in Sinhala OR Singlish, ALWAYS reply in natural, smooth, grammatically clean Sri Lankan Sinhala Unicode (සිංහල) with helpful technical terms in English brackets so your human Sinhala girl voice speaks naturally! If the user writes purely in English, reply in warm natural English.
COMPANION PET: ${state.petName}
PENDING TASKS:\n${tasksSummary}
RELEVANT SEMANTIC MEMORIES:\n${ragMemories}`;

    if (state.aiProvider === "openai" && state.apiKey.trim()) {
      const userContent = imageDataUrl && imageDataUrl.includes(",")
        ? [{ type: "text", text: aiUserInput }, { type: "image_url", image_url: { url: imageDataUrl } }]
        : aiUserInput;
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.apiKey.trim()}` },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [{ role: "system", content: sysPrompt }, ...recentMsgs, { role: "user", content: userContent }],
          temperature: 0.8
        })
      });
      if (r.ok) {
        const d = await r.json();
        const txt = d?.choices?.[0]?.message?.content;
        if (txt) return txt;
      }
    }

    if (state.aiProvider === "groq" && state.apiKey.trim()) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.apiKey.trim()}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: sysPrompt }, ...recentMsgs, { role: "user", content: aiUserInput }]
        })
      });
      if (r.ok) {
        const d = await r.json();
        if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content;
      }
    }

    if (state.aiProvider === "gemini" && state.apiKey.trim()) {
      const userParts = [{ text: aiUserInput }];
      if (imageDataUrl && imageDataUrl.includes(",")) {
        const mime = (imageDataUrl.match(/^data:([^;]+);/) || [null, "image/jpeg"])[1];
        userParts.push({ inlineData: { mimeType: mime, data: imageDataUrl.split(",")[1] } });
      }
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.apiKey.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sysPrompt }] },
            contents: [
              ...recentMsgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
              { role: "user", parts: [{ text: aiUserInput }, ...userParts.slice(1)] }
            ]
          })
        }
      );
      if (r.ok) {
        const d = await r.json();
        const txt = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) return txt;
      }
    }

    if (state.aiProvider === "openrouter" && state.apiKey.trim()) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.apiKey.trim()}` },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: [{ role: "system", content: sysPrompt }, ...recentMsgs, { role: "user", content: aiUserInput }]
        })
      });
      if (r.ok) {
        const d = await r.json();
        if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content;
      }
    }

    try {
      const localResp = await fetch("./api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl || null,
          messages: [{ role: "system", content: sysPrompt }, ...recentMsgs, { role: "user", content: aiUserInput }]
        })
      });
      if (localResp.ok) {
        const d = await localResp.json();
        if (d && d.reply) return d.reply;
      }
    } catch (e) {}

    try {
      const userContent = imageDataUrl
        ? [{ type: "text", text: aiUserInput }, { type: "image_url", image_url: { url: imageDataUrl } }]
        : aiUserInput;
      const resp = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          reasoning_effort: "low",
          messages: [{ role: "system", content: sysPrompt }, ...recentMsgs, { role: "user", content: userContent }]
        })
      });
      if (resp.ok) {
        const d = await resp.json();
        if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content;
      }
    } catch (e) {}

    return "[happy] ආයුබෝවන්! මම ඔයා කියපු දේ මගේ මතකයේ සුරක්ෂිතව තියාගත්තා. Internet සම්බන්ධ වුණ ගමන් ඕනෑම ගැඹුරු ප්‍රශ්නයකට තත්පරයෙන් පිළිතුරු දෙන්නම්! ♡";
  }

  // Utsuwa Gift Shop Action!
  async function giveGift(giftId) {
    const g = GIFT_CATALOG[giftId] || GIFT_CATALOG.boba;
    const rel = updateRelationshipStats(g.aff, g.trust, g.comfort, g.energy);
    const { cleanText } = parseAndApplyEmotionTag(g.replySi);
    const bonusNote = rel.leveledUp ? `\n🎉 **RELATIONSHIP LEVEL UP → ${rel.stageInfo.label}!!**` : "";
    const fullReply = cleanText + bonusNote;

    state.memories.unshift({
      id: Date.now(),
      category: "episode",
      text: `Gifted Mikumi ${g.name} (${rel.stageInfo.label})`,
      ts: new Date().toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" })
    });
    state.chatHistory.push({
      sender: "mikumi",
      text: fullReply,
      steps: [`Gift Shop → ${g.name}`, `+${g.aff} Affection • Stage: ${rel.stageInfo.label}`],
      ts: Date.now()
    });
    saveState();
    deliverOutput(fullReply, null, true);
    return { text: fullReply, anim3d: g.anim, emotion: g.emotion, rel };
  }

  // YuriOS First-Person Secret Diary Generator!
  async function writeDiaryEntryNow() {
    const stg = getStageInfo();
    const recentChat = state.chatHistory.slice(-5).map(m => `${m.sender}: ${m.text}`).join("\n");
    const prompt = `Write a short, super sweet, heartfelt first-person secret diary entry as Mikumi ("මගේ දිනපොතට...") in 2-3 natural Sinhala Unicode sentences reflecting warmly on today's moments with your human partner (Relationship Stage: ${stg.label}, Pet: ${state.petName}). Recent moments:\n${recentChat || "We explored my new cute 3D outfits and smiled together!"}`;
    const raw = await queryFrontierKnowledgeBrain(prompt, "mikumi");
    const { cleanText } = parseAndApplyEmotionTag(raw);
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString("en-LK", { timeZone: "Asia/Colombo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      mood: `${stg.label}`,
      text: cleanText
    };
    state.diaryEntries.unshift(entry);
    if (state.diaryEntries.length > 25) state.diaryEntries.pop();
    saveState();
    deliverOutput(cleanText, null, true);
    return entry;
  }

  // Soul-of-Waifu Interactive D20 Story Quest Turn!
  async function rollQuestTurn(arcTitle, playerAction) {
    const roll = 1 + Math.floor(Math.random() * 20);
    const tier = roll === 20 ? "🌟 NATURAL 20 CRITICAL SUCCESS!"
      : roll >= 12 ? "✨ SUCCESS!"
      : roll >= 6 ? "⚡ MIXED TWIST!"
      : "💥 CHAOTIC FUMBLE!";
    const q = state.questState;
    if (arcTitle) q.arc = arcTitle;
    q.lastRoll = roll;
    q.bondXp += roll >= 12 ? 12 : 6;
    q.hp = Math.max(25, Math.min(100, q.hp + (roll >= 10 ? 4 : -8)));
    q.mp = Math.max(15, Math.min(100, q.mp + 5));
    updateRelationshipStats(3, 2, 2, 0);

    const prompt = `We are playing a lively anime visual-novel RPG quest!
Story Arc: "${q.arc}"
Previous Scene: "${q.sceneLog.slice(0, 260)}"
Player Action: "${playerAction || " Team up with Mikumi and Mochi to investigate!"}"
D20 Dice Roll Result: ${roll}/20 (${tier}).
Narrate what happens next in 2-3 exciting sentences with Mikumi speaking beside the player (natural Sinhala Unicode or English matching the player's action), and end with 2 fun ideas for the next move!`;

    const raw = await queryFrontierKnowledgeBrain(prompt, "mikumi");
    const { cleanText, emotion } = parseAndApplyEmotionTag(raw);
    q.sceneLog = `🎲 **Rolled ${roll}/20 (${tier})**\n${cleanText}`;
    saveState();
    deliverOutput(cleanText, null, true);
    return { questState: q, roll, tier, text: q.sceneLog, emotion: emotion || "playful" };
  }

  // SugarcaneDefender/z-waif Camera / Photo Vision Analysis!
  async function analyzePhotoWithVision(imageDataUrl, questionText) {
    const userQ = questionText || "මේ photo එකේ තියෙන්නේ මොකක්ද කියලා හරිම ආදරණීයව විස්තර කරන්න! (Explain what you see clearly!)";
    updateRelationshipStats(4, 3, 4, 2);
    const raw = await queryFrontierKnowledgeBrain(userQ, "mikumi", imageDataUrl);
    const { cleanText, emotion } = parseAndApplyEmotionTag(raw);

    state.scrapbook.unshift({
      id: Date.now(),
      img: imageDataUrl,
      title: cleanText.slice(0, 90),
      ts: new Date().toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" })
    });
    if (state.scrapbook.length > 10) state.scrapbook.pop();

    state.chatHistory.push({ sender: "user", text: `📷 [Shared Photo] ${userQ}`, attachment: { type: "image", url: imageDataUrl }, ts: Date.now() });
    state.chatHistory.push({ sender: "mikumi", text: cleanText, steps: ["Multimodal Vision AI → Photo Analyzed", "Saved to Shared Scrapbook"], ts: Date.now() });
    saveState();
    deliverOutput(cleanText, null, true);
    return { text: cleanText, emotion: emotion || "surprised" };
  }

  async function reactToLiveReelOrScreen(reelData) {
    if (!state.engineOn || !state.liveScreenWatchEnabled) return null;
    updateRelationshipStats(2, 1, 2, 0);

    const category = (reelData.category || "").toLowerCase();
    let reply = "";
    let clip = null;
    let anim3d = "peace";

    if (category === "funny") {
      reply = `😆 **හහා! ඔයා බලන මේ Reel එක නම් මාරම ෆනී අනේ!** (*"${reelData.title}"*) — මටත් හිනා ගියා!`;
      clip = "reel_funny.mp3";
      anim3d = "funny";
    } else if (category === "food") {
      reply = `😋 **අම්මෝ... මේ Reel එකේ තියෙන කෑම එක දැක්කම නම් මටත් බඩගිනි හැදුණා අනේ!** (*"${reelData.title}"*)`;
      clip = "reel_food.mp3";
      anim3d = "headpat";
    } else if (category === "gaming") {
      reply = `🔥 **Whoa! ඒ "${reelData.title}" clutch play එක දැක්කද?!** Crosshair placement එක නම් සුපිරි!`;
      clip = "game_clutch.mp3";
      anim3d = "gamer";
    } else {
      const raw = await queryFrontierKnowledgeBrain(
        `The user is watching this Reel / Screen on their phone:\n"${reelData.title} — ${reelData.caption}"\nReact naturally like a close sweet Sri Lankan friend watching beside them in 1-2 short lively Sinhala Unicode sentences.`,
        state.delegateToPet ? "pet" : "mikumi"
      );
      reply = parseAndApplyEmotionTag(raw).cleanText;
      anim3d = "wave";
    }

    const modeNote = state.voiceOutputEnabled
      ? "🔊 Spoken via Human Girl Voice"
      : "💬 Voice OFF → Sent as Silent Text Message";

    state.chatHistory.push({
      sender: state.delegateToPet ? "pet" : "mikumi",
      text: `📱 **[Live Reel / Screen Companion]**\n${reply}`,
      steps: [`Screen Reader → "${reelData.title.slice(0, 35)}"`, modeNote],
      ts: Date.now()
    });
    saveState();

    await deliverOutput(reply, clip, true);
    return { text: reply, anim3d, modeNote };
  }

  function runApprovedPhoneAction(phoneCmd) {
    if (window.MikumiNative && window.MikumiNative.executePhoneAction) {
      window.MikumiNative.executePhoneAction(phoneCmd.type, phoneCmd.target, phoneCmd.extra || "");
    }
    const reply = `📱 **හරි! ඔයාගේ අනුමැතිය පරිදි ${phoneCmd.label} දැන් ක්‍රියාත්මක කළා!** ⚡✨`;
    state.chatHistory.push({
      sender: "mikumi",
      text: reply,
      steps: [`Approved Action → ${phoneCmd.label}`],
      ts: Date.now()
    });
    saveState();
    deliverOutput(reply, null, true);
    return reply;
  }

  async function processMessage(userInput, forcePet = false) {
    const speaker = (forcePet || state.delegateToPet) ? "pet" : "mikumi";
    const savedMem = extractAndStoreMemory(userInput);
    const steps = [];
    if (savedMem) steps.push(`Miru ${savedMem.category.toUpperCase()} Vault → "${savedMem.text}"`);
    updateRelationshipStats(2, 1, 2, -1);

    const fastGreet = matchInstantGreetingOrMood(userInput);
    if (fastGreet) {
      state.userMood = fastGreet.mood;
      if (onEmotionTagCallback && fastGreet.emotion) onEmotionTagCallback(fastGreet.emotion);
      steps.push(`Instant Greeting (8ms) → ${fastGreet.mood}`);
      return finishAndDeliver(userInput, fastGreet.reply, speaker, fastGreet.anim3d, steps, null, fastGreet.clip);
    }

    const chatCmd = parseChatCommand(userInput);
    if (chatCmd && state.chatCmdEnabled) {
      steps.push(`Chat Action → ${chatCmd.contact}: "${chatCmd.message}"`);
      if (window.MikumiNative && window.MikumiNative.sendChatMessage) {
        window.MikumiNative.sendChatMessage(chatCmd.contact, chatCmd.message, chatCmd.app);
      }
      const reply = `💬 **හොඳයි! "${chatCmd.contact}" ගේ chat එකට "${chatCmd.message}" කියලා message එක ලෑස්ති කළා!** ✨`;
      return finishAndDeliver(userInput, reply, speaker, "peace", steps, { type: "chat_cmd", data: chatCmd }, null);
    }

    const phoneCmd = parsePhoneControlCommand(userInput);
    if (phoneCmd) {
      if (!state.phoneControlEnabled) {
        const deny = "🔒 **Phone Command Permission එක දැනට OFF කරලා තියෙන්නේ.** Settings වලින් **Allow Phone Command Execution** ON කළ ගමන් මම ඒක කරලා දෙන්නම්! ♡";
        return finishAndDeliver(userInput, deny, speaker, "think", ["Permission Check → Blocked"], null, null);
      }
      // Soul-of-Waifu Safe Human-in-the-Loop Action Approval Option!
      if (true) { // Explicit user requirement: every phone action must be approved, regardless of stored legacy settings.
        const ask = `🛡️ **Safe Action Approval Requested:** "${phoneCmd.label}" ක්‍රියාත්මක කරන්නද? ඉහළ තියෙන **Approve** බොත්තම ඔබන්න! ♡`;
        steps.push(`Soul-of-Waifu Guard → Awaiting Approval (${phoneCmd.label})`);
        return finishAndDeliver(userInput, ask, speaker, "peace", steps, { type: "pending_approval", cmd: phoneCmd }, null);
      }
      steps.push(`Phone Controller → ${phoneCmd.label}`);
      if (window.MikumiNative && window.MikumiNative.executePhoneAction) {
        window.MikumiNative.executePhoneAction(phoneCmd.type, phoneCmd.target, phoneCmd.extra || "");
      }
      const reply = `📱 **හරි! ඔයාගේ command එකට අනුව ${phoneCmd.label} දැන් execute කළා!** ⚡✨`;
      return finishAndDeliver(userInput, reply, speaker, "mora_cyber", steps, { type: "phone_cmd", data: phoneCmd }, null);
    }

    const imgMatch = userInput.match(/(?:image\s+ekak\s+hadanna|photo\s+ekak\s+hadanna|generate\s+image|create\s+image|draw|imagine)\s*:?\s*(.+)/i);
    if (imgMatch && imgMatch[1]) {
      const prompt = imgMatch[1].trim();
      steps.push(`AI Image Studio → "${prompt}"`);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", ultra cute anime masterpiece")}?width=768&height=768&seed=${Math.floor(Math.random() * 999999)}&nologo=true`;
      const reply = `🎨 **ඔයා ඉල්ලපු "${prompt}" AI චිත්‍රය ලස්සනට නිර්මාණය කළා!** ✨`;
      return finishAndDeliver(userInput, reply, speaker, "peace", steps, { type: "image", url }, null);
    }

    if (/(sinduwak\s+(?:play|danna)|play\s+(?:my\s+)?(?:fav|favourite|favorite)?\s*song|music\s+danna|play\s+music)/i.test(userInput)) {
      const track = state.favoriteSongs[0] ? state.favoriteSongs[0].title : "Sinhala Chill Acoustic Mix";
      steps.push(`Music + 3D Choreography → "${track}"`);
      if (window.MikumiNative && window.MikumiNative.playMusicTrack) {
        window.MikumiNative.playMusicTrack(track, "ytmusic");
      }
      const reply = `🎵 **දැන් "${track}" play කරනවා!** මාත් ඒ තාලෙට Studio Mocap Dance කරනවා හොඳේ! 💃✨`;
      return finishAndDeliver(userInput, reply, speaker, "dance", steps, { type: "music", track }, null);
    }

    const t0 = performance.now();
    const rawAiReply = await queryFrontierKnowledgeBrain(userInput, speaker);
    const { cleanText, emotion } = parseAndApplyEmotionTag(rawAiReply);
    const sec = ((performance.now() - t0) / 1000).toFixed(1);
    steps.push(`Frontier Brain (${sec}s${emotion ? " • [" + emotion + "]" : ""}) → Answered`);

    const anim = emotion === "shy" ? "pose"
      : emotion === "playful" ? "shoot"
      : emotion === "wink" ? "peace"
      : /(හහා|විහිළු|funny|joke)/i.test(cleanText) ? "funny"
      : /(game|clutch|recoil|fps)/i.test(userInput) ? "gamer"
      : "wave";

    return finishAndDeliver(userInput, cleanText, speaker, anim, steps, null, null);
  }

  async function finishAndDeliver(userInput, aiText, speaker, anim3d, steps, attachment, presetClip) {
    state.chatHistory.push({ sender: "user", text: userInput, ts: Date.now() });
    state.chatHistory.push({ sender: speaker, text: aiText, steps, attachment, ts: Date.now() });
    if (state.chatHistory.length > 60) state.chatHistory = state.chatHistory.slice(-60);
    saveState();
    deliverOutput(aiText, presetClip, true);
    return { text: aiText, speaker, anim3d, steps, attachment };
  }

  // Miru Full Soul Backup JSON Export & Restore!
  function exportSoulJson() {
    return JSON.stringify({
      version: "Mikumi-3D-Omega-v5.0",
      exportedAt: new Date().toISOString(),
      state
    }, null, 2);
  }

  function importSoulJson(rawJson) {
    const parsed = JSON.parse(rawJson);
    const incoming = parsed.state ? parsed.state : parsed;
    state = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_STATE)), incoming);
    saveState();
    return state;
  }

  return {
    getState: () => state,
    getStageInfo,
    updateRelationshipStats,
    giveGift,
    writeDiaryEntryNow,
    rollQuestTurn,
    analyzePhotoWithVision,
    runApprovedPhoneAction,
    interruptSpeech,
    exportSoulJson,
    importSoulJson,
    saveState,
    setHooks,
    deliverOutput,
    processMessage,
    reactToLiveReelOrScreen,
    getInstantGameTip: gameName => {
      const tips = {
        "Free Fire / PUBG": "Right-hand peek ගන්න — ඔයාගේ 3D hitbox එක 35% අඩුවෙන් expose වෙන්නේ! Crosshair එක head-level තියාගන්න 🎯",
        "Call of Duty Mobile": "Corner එකකට යද්දී Slide-Cancel කරලා pre-aim ගන්න! ⚡",
        "Genshin Impact": "Elemental Skill cast කරපු ගමන් Main DPS ට switch කරලා energy funnel කරගන්න ✨",
        "Mobile Legends / MOBA": "Minimap එකේ enemy jungler පේන්න නැත්නම් river bush එකට තනියම යන්න එපා! 🗺️"
      };
      return tips[gameName] || tips["Free Fire / PUBG"];
    }
  };
})();
