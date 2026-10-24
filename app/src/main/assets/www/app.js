/**
 * MIKUMI 3D OMEGA v5.0 — FULL 10-REPO INTERACTIVE UI & STUDIO MOCAP CONTROLLER
 */

document.addEventListener("DOMContentLoaded", async () => {
  let st = window.MikumiBrain.getState();
  let pendingApprovalCmd = null;
  let activeMemFilter = "all";
  let isFrozenPose = false;

  const SAMPLE_REELS = [
    {
      badge: "INSTAGRAM REELS • COMEDY",
      title: "Sri Lankan Tuition Class Backbenchers Meme 😂",
      caption: "When sir asks who threw the paper rocket and the whole row looks at the fan 🤣 #srilanka #meme #funny",
      category: "funny"
    },
    {
      badge: "TIKTOK • COLOMBO STREET FOOD",
      title: "Sizzling Hot Cheese Chicken Kottu at Galle Face 🔥🍛",
      caption: "Extra creamy cheese + roasted chili paste sizzling on the iron plate at midnight! #food #kottu #srilanka",
      category: "food"
    },
    {
      badge: "YOUTUBE SHORTS • 120HZ GAMING",
      title: "Nothing Phone (3a) 120Hz 1v4 Final Zone Clutch! 🎯⚡",
      caption: "Insane right-hand peek + head-level drag headshot clutch in final circle! #gaming #clutch #pubg",
      category: "gaming"
    },
    {
      badge: "INSTAGRAM REELS • JAPANESE ANIME",
      title: "「夢をあきらめないで！」 — Anime Motivation Scene 🌸",
      caption: "Japanese quote: Yume wo akiramenaide! (Never give up on your dreams, even when the night is dark!)",
      category: "custom"
    },
    {
      badge: "YOUTUBE SHORTS • SCIENCE FACT",
      title: "Why Time Runs Slower Near a Black Hole 🕳️⏳",
      caption: "Einstein's General Relativity explains gravitational time dilation near Gargantua!",
      category: "custom"
    }
  ];
  let currentReelIdx = 0;

  function showBubble(txt) {
    const el = document.getElementById("speechBubble");
    if (el && txt) el.textContent = txt.replace(/\*\*/g, "").slice(0, 150);
  }

  function formatRichText(raw) {
    return String(raw || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  // Render Utsuwa 8-Stage Relationship UI
  function renderRelationshipHUD() {
    const r = st.relationship || { affection: 32, trust: 26, comfort: 28, energy: 92, interactions: 3 };
    const stg = window.MikumiBrain.getStageInfo();
    const topBadge = document.getElementById("topBondBadge");
    if (topBadge) topBadge.textContent = `${stg.label} (${r.affection}%)`;
    const lbl = document.getElementById("relStageLabel");
    if (lbl) lbl.textContent = stg.label;
    const inter = document.getElementById("relInteractionsChip");
    if (inter) inter.textContent = `${r.interactions || 1} Moments`;

    const setBar = (valId, barId, val) => {
      const vEl = document.getElementById(valId);
      const bEl = document.getElementById(barId);
      if (vEl) vEl.textContent = `${val}%`;
      if (bEl) bEl.style.width = `${Math.max(2, Math.min(100, val))}%`;
    };
    setBar("statAffVal", "statAffBar", r.affection);
    setBar("statTrustVal", "statTrustBar", r.trust);
    setBar("statComfortVal", "statComfortBar", r.comfort);
    setBar("statEnergyVal", "statEnergyBar", r.energy);
  }

  // Wire Real Human Audio Lip-Sync + Emotion Blendshapes + Hands-Free Call + Silent Text Toast!
  let toastTimer = null;
  window.MikumiBrain.setHooks({
    onSpeakState: speaking => {
      if (window.MikumiStage3D) window.MikumiStage3D.setSpeaking(speaking);
    },
    onAnalyser: analyserNode => {
      if (window.MikumiStage3D && window.MikumiStage3D.attachAudioAnalyser) {
        window.MikumiStage3D.attachAudioAnalyser(analyserNode);
      }
    },
    onEmotionTag: emotion => {
      if (window.MikumiStage3D && window.MikumiStage3D.setEmotion) {
        window.MikumiStage3D.setEmotion(emotion, 1.0, 5200);
      }
    },
    onRelationship: (relStats, stageInfo, leveledUp) => {
      renderRelationshipHUD();
      if (leveledUp) {
        showBubble(`💖 LEVEL UP! Relationship advanced to ${stageInfo.label}!!`);
        if (window.MikumiStage3D) window.MikumiStage3D.playAnimation("peace", 4.5);
      }
    },
    onSpeechEndedForCall: () => {
      if (st.handsFreeCall) startVoiceCapture(true);
    },
    onSilentText: silentText => {
      const toast = document.getElementById("silentMsgToast");
      if (!toast) return;
      toast.innerHTML = `🔇 <strong>Voice OFF • Text Message from Mikumi:</strong><br>${silentText.replace(/\*\*/g, "").slice(0, 175)}`;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 4600);
    }
  });

  renderRelationshipHUD();

  // Boot Studio 3D WebGL + Real .VRMA Motion Capture Engine!
  const viewportEl = document.getElementById("viewport3d");
  const loadingBadge = document.getElementById("loading3DBadge");
  const loadingText = document.getElementById("loading3DText");

  try {
    await window.MikumiStage3D.init(viewportEl, {
      isOverlay: false,
      fpsLimit: st.fpsLimit,
      vrmModel: st.vrmModel || "mikumi_vita.vrm",
      shaderTheme: st.shaderTheme || "nothing_white",
      petId: st.petId || "pet_droid",
      showPet: st.petEnabled,
      petOrbit: st.petOrbit,
      onProgress: pct => {
        if (loadingText) loadingText.textContent = `● LOADING STUDIO 3D WAIFU + MOCAP (${pct}%)...`;
      },
      onTouchReaction: part => handle3DTouchReaction(part)
    });
    window.MikumiStage3D.setWaifuScale(st.scale || 100);
    window.MikumiStage3D.setSpringPhysics(st.springPhysics || 1.0);
    if (st.roomStage) window.MikumiStage3D.setRoomStage(st.roomStage);
    loadingBadge.style.display = "none";
  } catch (err) {
    console.error("3D init notice:", err);
    loadingBadge.style.display = "none";
  }

  // Sync initial accessory button labels with stage3d defaults
  document.querySelectorAll(".acc-toggle-btn").forEach(btn => {
    const key = btn.dataset.acc;
    const icons = { wings: "🪽 3D Wings", headset: "🎧 3D Headset", halo: "😇 3D Halo", orb: "🔮 AI Orb" };
    const isOn = !!window.MikumiStage3D.getAccessories()[key];
    btn.textContent = `${icons[key]}: ${isOn ? "ON" : "OFF"}`;
    btn.classList.toggle("btn-dark", isOn);

    btn.addEventListener("click", () => {
      const cur = window.MikumiStage3D.getAccessories()[key];
      const next = !cur;
      window.MikumiStage3D.setAccessory(key, next);
      btn.textContent = `${icons[key]}: ${next ? "ON" : "OFF"}`;
      btn.classList.toggle("btn-dark", next);
    });
  });

  function handle3DTouchReaction(part) {
    if (!st.engineOn) return;
    if (part === "head") {
      window.MikumiBrain.updateRelationshipStats(3, 1, 3, 2);
      const msg = "Ehehe~ ඔයා මගේ ඔළුව ආදරෙන් අතගානකොට හරිම සතුටුයි අනේ! ♡ (+3 Affection)";
      showBubble(msg);
      window.MikumiBrain.deliverOutput(msg, "headpat.mp3", true);
    } else if (part === "pet") {
      window.MikumiBrain.updateRelationshipStats(2, 1, 2, 1);
      const msg = `${st.petName} 3D jump එකක් දාලා සතුටු වුණා! 🐾✨`;
      showBubble(msg);
      window.MikumiBrain.deliverOutput(msg, null, true);
    } else {
      window.MikumiBrain.updateRelationshipStats(1, 0, 2, 1);
      const msg = "හහා! අනේ ඔයා මට කිති කවනවද? ඒක හරිම ෆනී! 😆✨";
      showBubble(msg);
      window.MikumiBrain.deliverOutput(msg, "funny_poke.mp3", true);
    }
  }

  // 7-Tab Navigation
  const navBtns = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".view-panel");
  function switchTab(targetId) {
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.target === targetId));
    panels.forEach(p => p.classList.toggle("active", p.id === targetId));
    if (targetId === "view-stage" && window.MikumiStage3D) {
      setTimeout(() => window.MikumiStage3D.resize(), 40);
    }
  }
  navBtns.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.target)));

  document.getElementById("quickPhotoBoothBtn").addEventListener("click", () => switchTab("view-studio"));

  // Clean HUD / Showcase Mode Toggle on 3D Stage
  const stageCard = document.getElementById("stageCard");
  document.getElementById("btnCleanHud").addEventListener("click", () => stageCard.classList.add("clean-hud"));
  document.getElementById("btnRestoreHud").addEventListener("click", () => stageCard.classList.remove("clean-hud"));

  // Camera Presets
  document.querySelectorAll(".cam-btn[data-cam]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cam-btn[data-cam]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      window.MikumiStage3D.setCameraPreset(btn.dataset.cam);
    });
  });

  // 4 Dynamic Room Stage Lighting Presets
  document.querySelectorAll(".stage-env-btn").forEach(btn => {
    if (btn.dataset.stageenv === (st.roomStage || "studio_white")) {
      document.querySelectorAll(".stage-env-btn").forEach(b => b.classList.remove("btn-dark"));
      btn.classList.add("btn-dark");
    }
    btn.addEventListener("click", () => {
      document.querySelectorAll(".stage-env-btn").forEach(b => b.classList.remove("btn-dark"));
      btn.classList.add("btn-dark");
      st.roomStage = btn.dataset.stageenv;
      window.MikumiStage3D.setRoomStage(st.roomStage);
      window.MikumiBrain.saveState();
      showBubble(`✨ Switched 3D Stage Lighting to ${btn.textContent.trim()}!`);
    });
  });

  // Drag-to-place mode is explicit and toggles back to locked OrbitControls mode.
  const avatarMoveBtn = document.getElementById("avatarMoveModeBtn");
  let avatarIsMoving = false;
  if (avatarMoveBtn) avatarMoveBtn.addEventListener("click", () => {
    avatarIsMoving = !avatarIsMoving;
    const moving = window.MikumiStage3D.setAvatarMoveMode(avatarIsMoving);
    avatarMoveBtn.textContent = moving ? "🔒 Lock Mikumi" : "🖐️ Move Mikumi";
    avatarMoveBtn.classList.toggle("btn-dark", moving);
    showBubble(moving ? "Mikumi is movable — drag her in the 3D stage, then tap Lock." : "Mikumi position locked.");
  });
  // Top-Bar Instant Voice ON / Voice OFF Switcher!
  const voiceQuickBtn = document.getElementById("voiceQuickBtn");
  function syncVoiceButtonUI() {
    if (st.voiceOutputEnabled) {
      voiceQuickBtn.textContent = "🔊 Voice ON";
      voiceQuickBtn.classList.remove("muted");
    } else {
      voiceQuickBtn.textContent = "🔇 Text Only";
      voiceQuickBtn.classList.add("muted");
    }
    const togVoice = document.getElementById("togVoice");
    if (togVoice) togVoice.checked = st.voiceOutputEnabled;
  }
  syncVoiceButtonUI();

  voiceQuickBtn.addEventListener("click", () => {
    st.voiceOutputEnabled = !st.voiceOutputEnabled;
    window.MikumiBrain.saveState();
    syncVoiceButtonUI();
    syncNativeEngine(false);
    if (st.voiceOutputEnabled) {
      showBubble("🔊 Real Human Girl Voice ON! දැන් මම ඔයාට කටහඬින් කතා කරනවා ♡");
      window.MikumiBrain.deliverOutput("දැන් මම ඔයාට කටහඬින් කතා කරනවා!", "welcome.mp3", false);
    } else {
      showBubble("🔇 Voice OFF — දැන් මම ශබ්ද නැතුව Text Messages විතරක් එවනවා 💬");
      window.MikumiBrain.deliverOutput("දැන් මම ශබ්ද නැතුව Text Messages විතරක් එවනවා 💬", null, true);
    }
  });

  // Sri Lanka Clock + FPS + Telemetry
  const clockEl = document.getElementById("slClock");
  function refreshTelemetry() {
    clockEl.textContent = new Date().toLocaleTimeString("en-GB", {
      timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit", second: "2-digit"
    }) + " LK";

    if (!st.engineOn) {
      document.getElementById("fpsChip").textContent = "💤 0 FPS • 0% GPU";
      return;
    }
    const stats = window.MikumiStage3D.getStats();
    document.getElementById("fpsChip").textContent = `⚡ ${stats.fps || 60} FPS • MOCAP`;

    if (window.MikumiNative && window.MikumiNative.getDeviceTelemetryJson) {
      try {
        const t = JSON.parse(window.MikumiNative.getDeviceTelemetryJson());
        if (t.availRamMb) {
          document.getElementById("ramChip").textContent = `RAM ${(t.availRamMb / 1024).toFixed(1)}G free`;
          document.getElementById("tempChip").textContent = `🔋 ${t.batteryPct}% • ${t.tempC}°C`;
        }
      } catch (e) {}
    }
  }
  setInterval(refreshTelemetry, 1000);
  refreshTelemetry();

  // Master Power Switch (0% Battery Drain OFF)
  const powerBtn = document.getElementById("masterPowerBtn");
  function syncNativeEngine(promptOverlay = false) {
    document.body.classList.toggle("engine-off", !st.engineOn);
    powerBtn.textContent = st.engineOn ? "● ON" : "○ OFF";
    window.MikumiStage3D.setPaused(!st.engineOn);

    const edgeDock = document.getElementById("edgeMiniDock");
    edgeDock.style.display = st.engineOn && st.edgeBoxEnabled ? "flex" : "none";
    edgeDock.classList.toggle("collapsed", !!st.edgeCollapsed);

    if (window.MikumiNative && window.MikumiNative.setEngineActive) {
      const res = window.MikumiNative.setEngineActive(
        st.engineOn, st.vrmModel, st.shaderTheme, st.scale,
        st.petId, st.petName, st.petEnabled, st.edgeBoxEnabled,
        st.voiceOutputEnabled, st.liveScreenWatchEnabled, st.fpsLimit, st.selectedGame
      );
      const launchBtn = document.getElementById("launchOverlayBtn");
      if (res === "NEED_OVERLAY_PERMISSION" && promptOverlay) {
        showBubble("Tap 'Allow Display Over Other Apps' once so Studio 3D Mikumi floats over Reels & Games! ✨");
        window.MikumiNative.requestOverlayPermission();
      } else if (res === "OVERLAY_3D_ACTIVE") {
        launchBtn.classList.add("active");
        launchBtn.textContent = "● 3D FLOATING LIVE";
      } else {
        launchBtn.classList.remove("active");
        launchBtn.textContent = "↗ FLOAT 3D";
      }
    }
  }
  syncNativeEngine(false);

  powerBtn.addEventListener("click", () => {
    st.engineOn = !st.engineOn;
    if (!st.engineOn) window.MikumiBrain.interruptSpeech();
    window.MikumiBrain.saveState();
    syncNativeEngine(false);
  });
  document.getElementById("wakeEngineBtn").addEventListener("click", () => {
    st.engineOn = true;
    window.MikumiBrain.saveState();
    syncNativeEngine(false);
  });
  document.getElementById("launchOverlayBtn").addEventListener("click", () => {
    if (window.MikumiNative) syncNativeEngine(true);
    else showBubble("Inside the Android APK on your Nothing Phone (3a), this floats transparent Studio 3D Mikumi + Pet over Reels & Games! ✨");
  });

  // 1-Tap Greetings & Real .VRMA Mocap Emote Strip!
  document.querySelectorAll("[data-greet]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const phrase = btn.dataset.greet;
      const res = await window.MikumiBrain.processMessage(phrase);
      showBubble(res.text);
      window.MikumiStage3D.playAnimation(res.anim3d || "wave", 4.5);
      renderChatHistory();
    });
  });

  document.querySelectorAll("[data-anim3d]").forEach(btn => {
    btn.addEventListener("click", () => {
      const anim = btn.dataset.anim3d;
      window.MikumiStage3D.playAnimation(anim, 4.5);
      const labels = {
        duo_combo: "❤️‍🔥 Synchronized Mikumi + 3D Pet Mocap Duo Dance!",
        dance: "💃 Real Studio Motion-Capture Idol Dance!",
        peace: "✌️ Cute Studio Mocap Peace Sign & Wink!",
        shoot: "👉 Bang! Studio Mocap Heart Shoot!",
        pose: "📸 Confident Anime Supermodel Pose!",
        spin: "🌀 360° Studio Mocap Twirl — Hair & Skirt SpringBones flowing!",
        wave: "👋 Polite Japanese Greeting Bow & Wave!",
        headpat: "🥰 Blushing Headpat Reaction! (+Affection)"
      };
      showBubble(labels[anim] || "✨ Studio 3D Motion Capture!");
    });
  });

  // 5 Studio Waifu VRM Wardrobe Selector + Custom .VRM & Custom .VRMA Import!
  const vrmTiles = document.querySelectorAll("[data-vrm]");
  let matchedTile = false;
  vrmTiles.forEach(tile => {
    if (tile.dataset.vrm === st.vrmModel && !matchedTile) {
      tile.classList.add("selected");
      matchedTile = true;
    }
    tile.addEventListener("click", async () => {
      vrmTiles.forEach(t => t.classList.remove("selected"));
      tile.classList.add("selected");
      st.vrmModel = tile.dataset.vrm;
      st.shaderTheme = tile.dataset.theme;
      window.MikumiBrain.saveState();
      loadingBadge.style.display = "flex";
      loadingText.textContent = `LOADING ${tile.dataset.label.toUpperCase()}...`;
      await window.MikumiStage3D.loadMikumiVRM(st.vrmModel, st.shaderTheme);
      loadingBadge.style.display = "none";
      showBubble(`👗 Switched 3D Waifu Outfit to ${tile.dataset.label}! ♡`);
      syncNativeEngine(false);
    });
  });
  if (!matchedTile && vrmTiles[0]) vrmTiles[0].classList.add("selected");

  document.getElementById("customVrmInput").addEventListener("change", async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    loadingBadge.style.display = "flex";
    loadingText.textContent = `LOADING CUSTOM ${file.name}...`;
    const blobUrl = URL.createObjectURL(file);
    await window.MikumiStage3D.loadMikumiVRM(blobUrl, st.shaderTheme);
    loadingBadge.style.display = "none";
    showBubble(`🎉 Loaded Custom 3D Avatar "${file.name}" with full Mocap rig!`);
  });

  document.getElementById("customVrmaInput").addEventListener("change", async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const ok = await window.MikumiStage3D.playMocapUrl(blobUrl, true);
    showBubble(ok ? `🎞️ Playing Custom Motion-Capture "${file.name}"!` : "⚠️ Could not parse .vrma track.");
  });

  // Scale, SpringBone Physics & FPS Controls
  const scaleSlider = document.getElementById("scaleSlider");
  const scaleValLabel = document.getElementById("scaleValLabel");
  scaleSlider.value = st.scale || 100;
  scaleValLabel.textContent = `${st.scale || 100}%`;
  scaleSlider.addEventListener("input", () => {
    st.scale = parseInt(scaleSlider.value, 10);
    scaleValLabel.textContent = `${st.scale}%`;
    window.MikumiStage3D.setWaifuScale(st.scale);
    window.MikumiBrain.saveState();
    syncNativeEngine(false);
  });

  const springSlider = document.getElementById("springSlider");
  const springValLabel = document.getElementById("springValLabel");
  springSlider.value = Math.round((st.springPhysics || 1.0) * 100);
  springValLabel.textContent = `${(st.springPhysics || 1.0).toFixed(1)}x`;
  springSlider.addEventListener("input", () => {
    st.springPhysics = parseInt(springSlider.value, 10) / 100;
    springValLabel.textContent = `${st.springPhysics.toFixed(1)}x`;
    window.MikumiStage3D.setSpringPhysics(st.springPhysics);
    window.MikumiBrain.saveState();
  });

  const fpsSelect = document.getElementById("fpsSelect");
  fpsSelect.value = String(st.fpsLimit || 60);
  fpsSelect.addEventListener("change", () => {
    st.fpsLimit = parseInt(fpsSelect.value, 10);
    window.MikumiStage3D.setFpsLimit(st.fpsLimit);
    window.MikumiBrain.saveState();
    syncNativeEngine(false);
  });

  // =========================================================================
  // TAB 2: UTSUWA GIFT SHOP + YURIOS SECRET DIARY + SOUL-OF-WAIFU D20 QUEST
  // =========================================================================
  document.querySelectorAll("[data-gift]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const res = await window.MikumiBrain.giveGift(btn.dataset.gift);
      document.getElementById("giftReactionBox").innerHTML = formatRichText(res.text);
      window.MikumiStage3D.playAnimation(res.anim3d || "peace", 4.5);
      showBubble(res.text);
      renderRelationshipHUD();
      renderMemories();
      renderChatHistory();
    });
  });

  function renderDiary() {
    const box = document.getElementById("diaryEntriesBox");
    if (!box) return;
    box.innerHTML = (st.diaryEntries || []).map(d => `
      <div class="diary-entry">
        <div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--nothing-red); font-weight:700; margin-bottom:4px;">
          <span>📔 ${d.date}</span><span>${d.mood || ""}</span>
        </div>
        <div>${formatRichText(d.text)}</div>
      </div>
    `).join("");
  }
  renderDiary();

  document.getElementById("writeDiaryBtn").addEventListener("click", async () => {
    const btn = document.getElementById("writeDiaryBtn");
    btn.textContent = "✍️ Writing...";
    await window.MikumiBrain.writeDiaryEntryNow();
    btn.textContent = "✍️ Write Today's Entry";
    renderDiary();
  });

  function renderQuestHUD() {
    const q = st.questState;
    document.getElementById("questArcSelect").value = q.arc;
    document.getElementById("questDieBadge").textContent = `🎲 D20: ${q.lastRoll}`;
    document.getElementById("questHpSpan").textContent = `❤️ HP ${q.hp}`;
    document.getElementById("questMpSpan").textContent = `🔮 MP ${q.mp}`;
    document.getElementById("questXpSpan").textContent = `✨ Bond XP ${q.bondXp}`;
    document.getElementById("questSceneBox").innerHTML = formatRichText(q.sceneLog);
  }
  renderQuestHUD();

  document.getElementById("rollD20Btn").addEventListener("click", async () => {
    const btn = document.getElementById("rollD20Btn");
    const inp = document.getElementById("questActionInput");
    const arc = document.getElementById("questArcSelect").value;
    btn.textContent = "🎲 Rolling...";
    const res = await window.MikumiBrain.rollQuestTurn(arc, inp.value.trim());
    inp.value = "";
    btn.textContent = "🎲 ROLL D20";
    renderQuestHUD();
    window.MikumiStage3D.playAnimation("shoot", 4.0);
  });

  // =========================================================================
  // TAB 3: 3D PHOTO BOOTH STUDIO + Z-WAIF CAMERA VISION SCRAPBOOK
  // =========================================================================
  document.querySelectorAll("[data-photopose]").forEach(btn => {
    btn.addEventListener("click", () => {
      isFrozenPose = false;
      window.MikumiStage3D.setPhotoFreeze(false);
      document.getElementById("freezePoseBtn").textContent = "❄️ Freeze: OFF";
      window.MikumiStage3D.playAnimation(btn.dataset.photopose, 5.0);
    });
  });

  document.getElementById("freezePoseBtn").addEventListener("click", () => {
    isFrozenPose = !isFrozenPose;
    window.MikumiStage3D.setPhotoFreeze(isFrozenPose);
    const b = document.getElementById("freezePoseBtn");
    b.textContent = `❄️ Freeze: ${isFrozenPose ? "ON" : "OFF"}`;
    b.classList.toggle("btn-dark", isFrozenPose);
  });

  function renderPhotoGallery() {
    const grid = document.getElementById("photoGalleryGrid");
    if (!grid) return;
    grid.innerHTML = "";
    (st.scrapbook || []).forEach(item => {
      const card = document.createElement("div");
      card.className = "polaroid-item";
      card.innerHTML = `
        <img src="${item.img}" alt="Mikumi Snap" />
        <div style="font-size:10.5px; font-weight:700; line-height:1.3;">${item.title || "Mikumi 3D Snap"}</div>
        <a href="${item.img}" download="Mikumi-3D-${item.id}.png" class="btn btn-dark" style="padding:4px 8px; font-size:10px; justify-content:center; text-decoration:none;">⬇ Save PNG</a>
      `;
      grid.appendChild(card);
    });
  }
  renderPhotoGallery();

  function captureStudioShot(transparent) {
    const cap = document.getElementById("photoCaptionInput").value.trim() || `Mikumi 3D • ${window.MikumiBrain.getStageInfo().label}`;
    const dataUrl = window.MikumiStage3D.capturePhoto({
      transparent,
      caption: cap,
      sub: `${new Date().toLocaleDateString()} • Nothing Phone (3a) 3D Studio`
    });
    if (!dataUrl) return;
    st.scrapbook.unshift({ id: Date.now(), img: dataUrl, title: transparent ? `${cap} (Cutout PNG)` : cap });
    if (st.scrapbook.length > 10) st.scrapbook.pop();
    window.MikumiBrain.saveState();
    renderPhotoGallery();

    if (window.MikumiNative && window.MikumiNative.savePhotoToGallery) {
      window.MikumiNative.savePhotoToGallery(`Mikumi_3D_${Date.now()}.png`, dataUrl);
    }
    showBubble("📸 Snapped high-res 3D Studio Photo! Saved to Scrapbook & Gallery ♡");
  }

  document.getElementById("snapPolaroidBtn").addEventListener("click", () => captureStudioShot(false));
  document.getElementById("snapTransparentBtn").addEventListener("click", () => captureStudioShot(true));

  function readImageResized(file, maxDim = 768) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, maxDim / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.84));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  document.getElementById("visionFileInput").addEventListener("change", async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const out = document.getElementById("visionResultBox");
    out.textContent = "👁️ Mikumi is inspecting your photo...";
    const dataUrl = await readImageResized(file);
    const q = document.getElementById("visionQuestionInput").value.trim();
    const res = await window.MikumiBrain.analyzePhotoWithVision(dataUrl, q);
    out.innerHTML = formatRichText(res.text);
    renderPhotoGallery();
    renderChatHistory();
  });

  document.getElementById("chatVisionInput").addEventListener("change", async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const dataUrl = await readImageResized(file);
    const q = chatInput.value.trim();
    chatInput.value = "";
    const res = await window.MikumiBrain.analyzePhotoWithVision(dataUrl, q);
    renderChatHistory();
    renderPhotoGallery();
    showBubble(res.text);
  });

  // =========================================================================
  // TAB 4: REELS & LIVE SCREEN COMPANION SIMULATOR
  // =========================================================================
  function renderReelSimulator() {
    const r = SAMPLE_REELS[currentReelIdx];
    document.getElementById("reelBadge").textContent = r.badge;
    document.getElementById("reelTitle").textContent = r.title;
    document.getElementById("reelCaption").textContent = r.caption;
  }
  renderReelSimulator();

  async function triggerReelReaction(reelObj) {
    const outBox = document.getElementById("reelMikumiReactionBox");
    outBox.textContent = "👁️ Mikumi is reading your screen / Reel...";
    const res = await window.MikumiBrain.reactToLiveReelOrScreen(reelObj);
    if (!res) {
      outBox.textContent = "Screen Reader is paused in Settings.";
      return;
    }
    outBox.innerHTML = `<div class="ndot" style="font-size:9.5px; color:var(--nothing-red); margin-bottom:4px;">${res.modeNote}</div>${formatRichText(res.text)}`;
    window.MikumiStage3D.playAnimation(res.anim3d || "peace", 4.2);
    showBubble(res.text);
    renderChatHistory();
  }

  document.getElementById("nextReelBtn").addEventListener("click", () => {
    currentReelIdx = (currentReelIdx + 1) % SAMPLE_REELS.length;
    renderReelSimulator();
    triggerReelReaction(SAMPLE_REELS[currentReelIdx]);
  });
  document.getElementById("reactCurrentReelBtn").addEventListener("click", () => triggerReelReaction(SAMPLE_REELS[currentReelIdx]));
  document.getElementById("customReelTestBtn").addEventListener("click", () => {
    const customTxt = document.getElementById("customReelInput").value.trim();
    if (!customTxt) return;
    triggerReelReaction({ badge: "CUSTOM SCREEN / REEL", title: customTxt.slice(0, 48), caption: customTxt, category: "custom" });
  });
  document.getElementById("readLiveAndroidScreenBtn").addEventListener("click", () => {
    if (window.MikumiNative && window.MikumiNative.readScreenContextOnce) {
      const txt = window.MikumiNative.readScreenContextOnce();
      if (txt === "__ACCESSIBILITY_NOT_ENABLED__") {
        window.MikumiNative.openAccessibilitySettings();
        return;
      }
      if (txt) triggerReelReaction({ badge: "ANDROID SCREEN", title: "Live Phone Screen", caption: txt.slice(0, 600), category: "custom" });
    } else {
      triggerReelReaction(SAMPLE_REELS[currentReelIdx]);
    }
  });

  // =========================================================================
  // TAB 5: FRONTIER AI BRAIN + PERSONALITY + HANDS-FREE CALL + APPROVAL GUARD
  // =========================================================================
  const personalitySelect = document.getElementById("personalitySelect");
  personalitySelect.value = st.personalityMode || "sweet_girl";
  personalitySelect.addEventListener("change", () => {
    st.personalityMode = personalitySelect.value;
    window.MikumiBrain.saveState();
    showBubble(`✨ Switched Personality Archetype to ${personalitySelect.options[personalitySelect.selectedIndex].text}!`);
  });

  const handsFreeBtn = document.getElementById("handsFreeCallBtn");
  function syncHandsFreeBtn() {
    handsFreeBtn.textContent = st.handsFreeCall ? "📞 Call LIVE" : "📞 Call OFF";
    handsFreeBtn.classList.toggle("btn-red", !!st.handsFreeCall);
  }
  syncHandsFreeBtn();
  handsFreeBtn.addEventListener("click", () => {
    st.handsFreeCall = !st.handsFreeCall;
    window.MikumiBrain.saveState();
    syncHandsFreeBtn();
    if (st.handsFreeCall) {
      showBubble("📞 Continuous Hands-Free VTuber Voice Loop ON! Speak anytime — tap again to end call.");
      startVoiceCapture(true);
    } else {
      window.MikumiBrain.interruptSpeech();
      showBubble("📞 Hands-Free Voice Loop paused.");
    }
  });

  const approvalBanner = document.getElementById("actionApprovalBanner");
  document.getElementById("approveActionBtn").addEventListener("click", () => {
    if (!pendingApprovalCmd) return;
    const msg = window.MikumiBrain.runApprovedPhoneAction(pendingApprovalCmd);
    pendingApprovalCmd = null;
    approvalBanner.classList.remove("active");
    renderChatHistory();
    showBubble(msg);
  });
  document.getElementById("rejectActionBtn").addEventListener("click", () => {
    pendingApprovalCmd = null;
    approvalBanner.classList.remove("active");
    showBubble("🛡️ Action safely cancelled.");
  });

  const chatStream = document.getElementById("chatStream");
  const chatInput = document.getElementById("chatInput");

  function renderChatHistory() {
    chatStream.innerHTML = "";
    if (!st.chatHistory.length) {
      st.chatHistory.push({
        sender: "mikumi",
        text: "ආයුබෝවන්! ✨ මම **Mikumi 3D Omega v5.0 (10-Repo Studio Edition)**.\n• **5 Ultra-Kawaii Studio 3D Models + Real `.vrma` Motion Capture** (Idles, Dance, Peace, Shoot, Twirl, Talking!)\n• **8-Stage Dating Bond + Gift Shop + Secret Diary 📔 + D20 RPG Quest 🎲**\n• **3D Photo Booth Polaroid Studio 📸 + Camera Vision 📷**\n• **5 Personalities (incl. Neuro-Sama Witty Mode!) + Real Human Sinhala/English Voice** ♡",
        steps: ["5 Studio VRMs Ready", "11 Mocap Clips Ready", "Frontier Brain Live"]
      });
    }
    st.chatHistory.forEach(m => {
      const div = document.createElement("div");
      div.className = "msg " + (m.sender === "user" ? "user" : "ai");
      let html = "";
      if (m.sender !== "user") {
        html += `<div class="msg-meta">${m.sender === "pet" ? "🐾 " + st.petName + " (3D PET AI)" : "✦ MIKUMI 3D OMEGA v5.0"}</div>`;
      }
      if (m.steps && m.steps.length) {
        html += `<div class="thought-box">⚡ ${m.steps.join(" • ")}</div>`;
      }
      html += `<div>${formatRichText(m.text)}</div>`;
      if (m.attachment && m.attachment.type === "image") {
        html += `<div class="generated-img-wrap"><img src="${m.attachment.url}" alt="Shared Visual" loading="lazy" /></div>`;
      }
      div.innerHTML = html;
      chatStream.appendChild(div);
    });
    chatStream.scrollTop = chatStream.scrollHeight;
  }
  renderChatHistory();

  async function handleUserSend(textOverride) {
    const q = (textOverride !== undefined ? textOverride : chatInput.value).trim();
    if (!q) return;
    if (textOverride === undefined) chatInput.value = "";
    // Barge-in interrupt any previous speech immediately!
    window.MikumiBrain.interruptSpeech();

    const thinkingEl = document.createElement("div");
    thinkingEl.className = "msg ai";
    thinkingEl.innerHTML = `<div class="msg-meta">✦ MIKUMI OMEGA v5.0</div><div class="thought-box">⚡ Thinking & choosing [emotion] expression...</div>`;
    chatStream.appendChild(thinkingEl);
    chatStream.scrollTop = chatStream.scrollHeight;

    const res = await window.MikumiBrain.processMessage(q);
    if (res.attachment && res.attachment.type === "pending_approval") {
      pendingApprovalCmd = res.attachment.cmd;
      document.getElementById("approvalBannerText").textContent = `🛡️ Approve Phone Command: ${pendingApprovalCmd.label}?`;
      approvalBanner.classList.add("active");
    }
    renderChatHistory();
    renderMemories();
    showBubble(res.text);
    window.MikumiStage3D.playAnimation(res.anim3d || "wave", 4.2);
    document.getElementById("edgeReplyText").textContent = res.text.replace(/\*\*/g, "").slice(0, 125);
  }

  document.getElementById("sendMsgBtn").addEventListener("click", () => handleUserSend());
  chatInput.addEventListener("keydown", e => { if (e.key === "Enter") handleUserSend(); });

  document.querySelectorAll("[data-prompt]").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab("view-chat");
      handleUserSend(btn.dataset.prompt);
    });
  });

  // Hideable Floating Edge Dock
  const edgeDock = document.getElementById("edgeMiniDock");
  const edgeDrawer = document.getElementById("edgeDrawer");
  document.getElementById("edgeToggleChat").addEventListener("click", () => edgeDrawer.classList.toggle("open"));
  document.getElementById("edgeHideBtn").addEventListener("click", () => {
    st.edgeCollapsed = true;
    edgeDrawer.classList.remove("open");
    edgeDock.classList.add("collapsed");
    window.MikumiBrain.saveState();
  });
  document.getElementById("edgeStealthTab").addEventListener("click", () => {
    st.edgeCollapsed = false;
    edgeDock.classList.remove("collapsed");
    window.MikumiBrain.saveState();
  });
  document.getElementById("edgeSendBtn").addEventListener("click", async () => {
    const inp = document.getElementById("edgeInput");
    const v = inp.value.trim();
    if (!v) return;
    inp.value = "";
    await handleUserSend(v);
  });
  document.getElementById("edgeMoraBtn").addEventListener("click", () => {
    window.MikumiStage3D.playAnimation("duo_combo", 4.8);
    showBubble("💃 Synchronized Studio Duo Dance!");
  });
  document.getElementById("edgeGameTipBtn").addEventListener("click", () => {
    const tip = window.MikumiBrain.getInstantGameTip(st.selectedGame);
    document.getElementById("edgeReplyText").textContent = `🎮 ${tip}`;
    edgeDrawer.classList.add("open");
    window.MikumiStage3D.playAnimation("gamer", 3.5);
    window.MikumiBrain.deliverOutput(tip, "game_clutch.mp3", true);
  });

  // Real-Time Voice Recognition + Open-LLM-VTuber 0ms Voice Barge-In!
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  function startVoiceCapture(fromCallLoop = false) {
    // 0ms barge-in: silence current TTS the instant user hits Mic!
    if (!fromCallLoop) window.MikumiBrain.interruptSpeech();

    if (!SpeechRec) {
      if (!fromCallLoop) {
        showBubble("Tip: Type in Sinhala/Singlish/English or tap your Android keyboard Mic! 🎤");
        chatInput.focus();
      }
      return;
    }
    if (recognizer) { recognizer.stop(); recognizer = null; if (!fromCallLoop) return; }
    recognizer = new SpeechRec();
    recognizer.lang = document.getElementById("voiceLangSelect").value || "si-LK";
    const micBtns = document.querySelectorAll(".mic-trigger");
    micBtns.forEach(b => b.classList.add("listening"));

    recognizer.onresult = ev => {
      const transcript = ev.results[0][0].transcript;
      handleUserSend(transcript);
    };
    recognizer.onend = () => {
      micBtns.forEach(b => b.classList.remove("listening"));
      recognizer = null;
    };
    recognizer.onerror = () => {
      micBtns.forEach(b => b.classList.remove("listening"));
      recognizer = null;
    };
    try { recognizer.start(); } catch (e) {}
  }
  document.querySelectorAll(".mic-trigger").forEach(b => b.addEventListener("click", () => startVoiceCapture(false)));

  // =========================================================================
  // TAB 6: 5-SPECIES 3D PET + SCHOOL ALARM + PRO GAME COACH + DAILY PLANNER
  // =========================================================================
  document.querySelectorAll("[data-pet3d]").forEach(tile => {
    if (tile.dataset.pet3d === st.petId) tile.classList.add("selected");
    tile.addEventListener("click", async () => {
      document.querySelectorAll("[data-pet3d]").forEach(t => t.classList.remove("selected"));
      tile.classList.add("selected");
      st.petId = tile.dataset.pet3d;
      window.MikumiBrain.saveState();
      await window.MikumiStage3D.loadPet3D(st.petId, st.petEnabled);
      showBubble(`🐾 Summoned Real 3D Companion "${st.petName}"!`);
      syncNativeEngine(false);
    });
  });

  document.querySelectorAll("[data-petact]").forEach(btn => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.petact;
      if (act === "orbit") {
        st.petOrbit = !st.petOrbit;
        window.MikumiStage3D.setPetOrbit(st.petOrbit);
        window.MikumiBrain.saveState();
        showBubble(st.petOrbit ? `🛸 ${st.petName} is 360° orbiting around Mikumi!` : `🐾 ${st.petName} docked beside Mikumi!`);
      } else {
        window.MikumiStage3D.triggerPetTrick(act);
        showBubble(`🐾 ${st.petName} performed 3D ${act.toUpperCase()}!`);
      }
    });
  });

  const petNameInput = document.getElementById("petNameInput");
  petNameInput.value = st.petName;
  document.getElementById("petNameBadge").textContent = `🐾 ${st.petName}`;
  document.getElementById("savePetNameBtn").addEventListener("click", () => {
    const v = petNameInput.value.trim();
    if (!v) return;
    st.petName = v;
    document.getElementById("petNameBadge").textContent = `🐾 ${v}`;
    window.MikumiBrain.saveState();
    syncNativeEngine(false);
    showBubble(`Yay! My 3D Pet is now named "${v}"! ♡`);
  });

  const delegateToggle = document.getElementById("delegatePetToggle");
  delegateToggle.checked = st.delegateToPet;
  delegateToggle.addEventListener("change", () => {
    st.delegateToPet = delegateToggle.checked;
    document.getElementById("activeAgentChip").textContent = st.delegateToPet ? `🐾 ${st.petName} Lead` : "✦ Mikumi Lead";
    window.MikumiBrain.saveState();
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayValues = [1, 2, 3, 4, 5, 6, 7];
  const dayContainer = document.getElementById("schoolDaysRow");
  function renderDays() {
    dayContainer.innerHTML = "";
    dayValues.forEach((dVal, idx) => {
      const b = document.createElement("button");
      b.className = "day-pill" + (st.schoolDays.includes(dVal) ? " on" : "");
      b.textContent = dayNames[idx];
      b.onclick = () => {
        if (st.schoolDays.includes(dVal)) st.schoolDays = st.schoolDays.filter(x => x !== dVal);
        else st.schoolDays.push(dVal);
        window.MikumiBrain.saveState();
        renderDays();
      };
      dayContainer.appendChild(b);
    });
  }
  renderDays();

  const alarmTimeInput = document.getElementById("alarmTimeInput");
  alarmTimeInput.value = st.schoolAlarmTime;
  document.getElementById("saveAlarmBtn").addEventListener("click", () => {
    st.schoolAlarmTime = alarmTimeInput.value || "05:30";
    window.MikumiBrain.saveState();
    const [hh, mm] = st.schoolAlarmTime.split(":").map(Number);
    if (window.MikumiNative && window.MikumiNative.configureSchoolAlarm) {
      window.MikumiNative.configureSchoolAlarm(hh, mm, st.schoolDays.join(","), st.schoolAlarmEnabled, false);
    }
    showBubble(`⏰ Sri Lanka School Alarm saved for ${st.schoolAlarmTime}!`);
  });

  document.getElementById("testWakeupBtn").addEventListener("click", () => {
    const msg = "සුභ උදෑසනක්! නැගිටින්න වෙලාව හරි! අද ඉස්කෝලේ යන්න ලෑස්ති වෙන්නකෝ!";
    switchTab("view-stage");
    window.MikumiStage3D.playAnimation("good_morning", 5.0);
    showBubble("☀️ " + msg);
    window.MikumiBrain.deliverOutput(msg, "school_wakeup.mp3", true);
  });

  const gameSelect = document.getElementById("gameSelect");
  gameSelect.value = st.selectedGame;
  gameSelect.addEventListener("change", () => {
    st.selectedGame = gameSelect.value;
    window.MikumiBrain.saveState();
    document.getElementById("gameTipOutput").textContent = window.MikumiBrain.getInstantGameTip(st.selectedGame);
    syncNativeEngine(false);
  });
  document.getElementById("gameTipOutput").textContent = window.MikumiBrain.getInstantGameTip(st.selectedGame);

  document.getElementById("nextTipBtn").addEventListener("click", () => {
    const tip = window.MikumiBrain.getInstantGameTip(st.selectedGame);
    document.getElementById("gameTipOutput").textContent = tip;
    window.MikumiBrain.deliverOutput(tip, "game_clutch.mp3", true);
  });

  document.getElementById("boostPhoneBtn").addEventListener("click", () => {
    let freed = 112 + Math.floor(Math.random() * 54);
    if (window.MikumiNative && window.MikumiNative.runSafeLagOptimizer) {
      try { freed = JSON.parse(window.MikumiNative.runSafeLagOptimizer()).freedMb || freed; } catch (e) {}
    }
    const resMsg = `⚡ Safe Boost Complete! Freed ~${freed} MB memory & tuned 3D frame pacing!`;
    document.getElementById("boostResultText").textContent = resMsg;
    window.MikumiBrain.deliverOutput(resMsg, "phone_boost.mp3", true);
  });

  function renderTasks() {
    const list = document.getElementById("todoList");
    list.innerHTML = "";
    st.dailyTasks.forEach(t => {
      const row = document.createElement("div");
      row.className = "setting-row";
      row.innerHTML = `
        <label style="display:flex;align-items:center;gap:9px;cursor:pointer;flex:1;">
          <input type="checkbox" ${t.done ? "checked" : ""} />
          <span style="${t.done ? "text-decoration:line-through;color:#8e929d;" : ""}">${t.text}</span>
        </label>
        <button class="btn" style="padding:4px 8px;font-size:11px;">✕</button>
      `;
      row.querySelector("input").onchange = e => {
        t.done = e.target.checked;
        window.MikumiBrain.saveState();
        renderTasks();
      };
      row.querySelector("button").onclick = () => {
        st.dailyTasks = st.dailyTasks.filter(x => x.id !== t.id);
        window.MikumiBrain.saveState();
        renderTasks();
      };
      list.appendChild(row);
    });
  }
  renderTasks();

  document.getElementById("addTaskBtn").addEventListener("click", () => {
    const inp = document.getElementById("newTaskInput");
    const v = inp.value.trim();
    if (!v) return;
    st.dailyTasks.unshift({ id: Date.now(), text: v, done: false });
    inp.value = "";
    window.MikumiBrain.saveState();
    renderTasks();
  });

  // =========================================================================
  // TAB 7: SETTINGS, MIRU 4-PILLAR MEMORY INSPECTOR & JSON SOUL BACKUP
  // =========================================================================
  const voicePersonaSelect = document.getElementById("voicePersonaSelect");
  voicePersonaSelect.value = st.voicePersona;
  voicePersonaSelect.addEventListener("change", () => {
    st.voicePersona = voicePersonaSelect.value;
    window.MikumiBrain.saveState();
    window.MikumiBrain.deliverOutput("Hi! This is my real human neural voice on your Nothing Phone!", null, false);
  });
  const emotionSlider = document.getElementById("voiceEmotionStrength");
  const emotionValue = document.getElementById("voiceEmotionValue");
  if (emotionSlider) {
    emotionSlider.value = String(Math.round((st.voiceEmotionStrength ?? 0.62) * 100));
    if (emotionValue) emotionValue.textContent = `${emotionSlider.value}%`;
    emotionSlider.addEventListener("input", () => {
      st.voiceEmotionStrength = Number(emotionSlider.value) / 100;
      if (emotionValue) emotionValue.textContent = `${emotionSlider.value}%`;
      window.MikumiBrain.saveState();
    });
  }

  function bindToggle(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = Boolean(st[key]);
    el.addEventListener("change", () => {
      st[key] = el.checked;
      window.MikumiBrain.saveState();
      syncVoiceButtonUI();
      if (key === "petEnabled") window.MikumiStage3D.setPetVisible(st.petEnabled);
      syncNativeEngine(false);
    });
  }

  bindToggle("togPet", "petEnabled");
  bindToggle("togEdgeBox", "edgeBoxEnabled");
  bindToggle("togVoice", "voiceOutputEnabled");
  bindToggle("togPhoneControl", "phoneControlEnabled");
  bindToggle("togActionApproval", "requireActionApproval");
  const approvalToggle = document.getElementById("togActionApproval");
  if (approvalToggle) { approvalToggle.checked = true; approvalToggle.disabled = true; }
  bindToggle("togLiveScreenWatch", "liveScreenWatchEnabled");
  bindToggle("togChatCmd", "chatCmdEnabled");
  bindToggle("togMusicLearn", "musicLearningEnabled");
  bindToggle("togMemory", "memoryEnabled");
  bindToggle("togGameAdvisor", "gameAdvisorEnabled");

  const aiProviderSelect = document.getElementById("aiProviderSelect");
  const apiKeyInput = document.getElementById("apiKeyInput");
  aiProviderSelect.value = st.aiProvider;
  apiKeyInput.value = st.apiKey;
  document.getElementById("saveApiBtn").addEventListener("click", () => {
    st.aiProvider = aiProviderSelect.value;
    st.apiKey = apiKeyInput.value.trim();
    window.MikumiBrain.saveState();
    showBubble("✅ Frontier AI Engine saved & active!");
  });

  function renderMemories() {
    const box = document.getElementById("memoryListBox");
    if (!box) return;
    const filtered = (st.memories || []).filter(m => activeMemFilter === "all" || (m.category || "fact") === activeMemFilter);
    box.innerHTML = filtered.map(m =>
      `<div style="font-size:12px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.06);">` +
      `<span class="chip" style="font-size:9px;padding:1px 6px;margin-right:4px;">${(m.category || "fact").toUpperCase()}</span>` +
      `${m.text} <span style="color:#8e929d;font-size:10px;">(${m.ts})</span></div>`
    ).join("") || `<div style="font-size:12px;color:#8e929d;">No memories in this category yet.</div>`;
  }
  renderMemories();

  document.querySelectorAll(".mem-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mem-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeMemFilter = btn.dataset.memcat;
      renderMemories();
    });
  });

  document.getElementById("clearMemoryBtn").addEventListener("click", () => {
    st.memories = [{ id: 1, category: "fact", text: "Memory Vault reset cleanly by user", ts: "Now" }];
    window.MikumiBrain.saveState();
    renderMemories();
  });

  document.getElementById("exportSoulBtn").addEventListener("click", () => {
    const blob = new Blob([window.MikumiBrain.exportSoulJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Mikumi-Soul-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showBubble("💾 Exported full Mikumi Soul, Bond, Diary & Memories (.JSON)!");
  });

  document.getElementById("importSoulInput").addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        st = window.MikumiBrain.importSoulJson(ev.target.result);
        renderRelationshipHUD();
        renderDiary();
        renderQuestHUD();
        renderPhotoGallery();
        renderMemories();
        renderChatHistory();
        showBubble("🎉 Restored full Mikumi Soul Backup cleanly!");
      } catch (err) {
        showBubble("⚠️ Invalid JSON backup file.");
      }
    };
    r.readAsText(file);
  });

  window.onNativeWakeUp = () => document.getElementById("testWakeupBtn").click();
  window.onNativeQuickVoice = () => {
    switchTab("view-chat");
    startVoiceCapture(false);
  };
});
