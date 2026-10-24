/**
 * MIKUMI 3D OMEGA v5.0 — ULTRA KAWAII STUDIO MOCAP WAIFU + 3D PET + MORA X ENGINE
 * Synthesizing 10 Open-Source AI Waifu Architectures for White Nothing Phone (3a):
 *   • JuiceBoxxGames/utsuwa: 5 Studio .VRM Avatars, .VRMA Mocap Mixer, Photo Booth, Stage Lighting, Spring Physics
 *   • yuri-os/YuriOS: VRMLookAtQuaternionProxy, Saccadic Eye Gaze, 10-Emotion Cubic Blendshape Controller
 *   • moeru-ai/airi: Organic Multi-Idle Crossfade Loop + Saccadic Micro-Movements
 *   • Open-LLM-VTuber: Live [emotion] Expression Tags + Voice Barge-In Stop Sync
 *   • semperai/amica & Awesome-AI-Waifu: Full Idol Dance / Peace / Shoot / Spin / Model Pose Mocap Suite
 *   • Preserves 100% of v4.0 5 Real 3D Companion Pets + World-Bone Valkyrie Wings, Halo, Headset & AI Orb!
 */

window.MikumiStage3D = (function () {
  const {
    THREE,
    GLTFLoader,
    OrbitControls,
    VRMLoaderPlugin,
    VRMUtils,
    VRMAnimationLoaderPlugin,
    createVRMAnimationClip,
    VRMLookAtQuaternionProxy
  } = window.MIKUMI_3D_LIBS;

  let container = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let controls = null;
  let isOverlayMode = false;
  let running = true;
  let photoFreeze = false;
  let targetFps = 60;
  let lastFrameMs = 0;

  // Real FPS Meter
  let frameCounter = 0;
  let fpsTimer = 0;
  let measuredFps = 60;

  // Lights & Holographic Stages
  let ambientLight, hemiLight, keyLight, fillLight, rimLight;
  let holoPlatformGroup = null;
  let baseDiscMesh = null;
  let innerRuneRing = null;
  let middleHexRing = null;
  let outerTechRing = null;
  let shockwaveRing = null;
  let shockwaveScale = 0;
  let petPadGroup = null;
  let petPadRing = null;
  let bedroomGroup = null;
  let activeStagePreset = "studio_white";
  let avatarMoveMode = false;
  let avatarDragPointer = null;

  // Floating 3D AI Core Orb
  let aiOrbGroup = null;
  let aiOrbCore = null;
  let aiOrbRing1 = null;
  let aiOrbRing2 = null;

  // Bone-Attached 3D Accessories on Mikumi
  // Default: Vita's own sculpted cyber cat-ears & hair ribbons shine freely while Halo + Valkyrie Wings + Orb glow!
  const accessories = {
    headset: false,
    wings: true,
    halo: true,
    orb: true
  };
  let accHeadsetGroup = null;
  let accHaloGroup = null;
  let accLeftWingPivot = null;
  let accRightWingPivot = null;
  let accWingsContainer = null;

  // Ambient 3D Aura Field + Burst Particles
  let ambientPoints = null;
  let ambientPositions = null;
  let ambientSpeeds = null;
  const AMBIENT_COUNT = 95;
  let particlesGroup = null;
  const activeParticles = [];

  // Smooth Camera Glide Targets (Portrait-Calibrated for Full-Body Waifu + 3D Pet)
  const desiredCamPos = new THREE.Vector3(0.08, 0.94, 3.24);
  const desiredTarget = new THREE.Vector3(0.07, 0.85, 0.0);
  let camGlideFrames = 0;

  // VRM Waifu + Studio .VRMA Motion Capture State
  let currentVrm = null;
  let currentModelId = "mikumi_vita.vrm";
  let vrmRootHolder = null;
  let vrmNormGroup = null; // Holds scale outside vrm.scene so createVRMAnimationClip never double-scales hips!
  let vrmMixer = null;
  let idleAction = null;
  let talkingAction = null;
  let emoteAction = null;
  let emoteActive = false;
  let idleCycleTimer = null;
  let idleIndex = 0;
  let loadGeneration = 0;
  let springSnapshot = [];
  let springIntensity = 1.0;

  let armDownSign = -1;
  let baseMaterials = [];
  let currentAction = "idle";
  let actionTimer = 0;
  let spinAngle = 0;
  let speakingActive = false;
  let speakFallbackPhase = 0;
  let audioAnalyser = null;
  let freqBins = null;
  let liveVoiceEnergy = 0;

  // YuriOS + Airi Saccadic Eye Gaze & Cubic Emotion Controller
  let lookAtTargetObj = null;
  let saccadeOffset = new THREE.Vector2(0, 0);
  let saccadeTimer = 0;
  let nextSaccadeAt = 1.1;

  const EMOTION_PALETTE = {
    neutral:   { expr: [], blend: 0.45 },
    happy:     { expr: [["happy", 0.72]], blend: 0.35 },
    shy:       { expr: [["happy", 0.35], ["relaxed", 0.42], ["sad", 0.16]], blend: 0.42 },
    playful:   { expr: [["happy", 0.68], ["surprised", 0.18]], blend: 0.28 },
    tender:    { expr: [["relaxed", 0.65], ["happy", 0.32]], blend: 0.50 },
    thinking:  { expr: [["relaxed", 0.42], ["ee", 0.12]], blend: 0.45 },
    surprised: { expr: [["surprised", 0.82]], blend: 0.20 },
    sad:       { expr: [["sad", 0.68]], blend: 0.42 },
    angry:     { expr: [["angry", 0.68]], blend: 0.30 },
    relaxed:   { expr: [["relaxed", 0.78], ["happy", 0.20]], blend: 0.45 },
    wink:      { expr: [["happy", 0.78], ["blinkRight", 0.95]], blend: 0.22 }
  };
  let currentEmotionName = "happy";
  let emotionProgress = 1;
  let emotionDuration = 0.4;
  let emotionStartVals = {};
  let emotionTargetVals = { happy: 0.26 };
  let emotionResetHandle = null;

  let blinkTimer = 2.4;
  let isBlinking = false;
  let blinkProgress = 0;
  let pointerNDC = new THREE.Vector2(0, 0);
  let smoothGaze = new THREE.Vector2(0, 0);
  let modelScale = 1.0;

  // Global parsed .VRMA cache (never re-downloads across model switches or idle cycles!)
  const vrmAnimCache = new Map();
  const IDLE_POOL = [
    "./anims/idle_1.vrma",
    "./anims/idle_2.vrma",
    "./anims/idle_3.vrma",
    "./anims/idle_4.vrma"
  ];
  const MOCAP_MAP = {
    wave:         "./anims/greeting.vrma",
    greeting:     "./anims/greeting.vrma",
    good_morning: "./anims/greeting.vrma",
    peace:        "./anims/peace.vrma",
    heart:        "./anims/peace.vrma",
    dance:        "./anims/dance.vrma",
    gamer:        "./anims/dance.vrma",
    mora_cyber:   "./anims/spin.vrma",
    spin:         "./anims/spin.vrma",
    shoot:        "./anims/shoot.vrma",
    pose:         "./anims/pose.vrma",
    model_pose:   "./anims/pose.vrma",
    good_night:   "./anims/idle_2.vrma",
    headpat:      "./anims/idle_2.vrma",
    funny:        "./anims/shoot.vrma"
  };

  // 3D Companion Pet State
  let petHolder = null;
  let petMixer = null;
  let petActions = {};
  let currentPetType = "pet_droid";
  let petOrbitMode = false;
  let petJumpVel = 0;
  let petJumpY = 0;
  let petSpin = 0;
  let proceduralPet = null;

  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();

  // Balanced Anime Beauty Lighting + Shader Themes (Crisp whites, zero bloom washout!)
  const SHADER_THEMES = {
    nothing_white:  { tint: 0xffffff, rim: 0xd71921, ring: 0xd71921, wing: 0xff2a55, fill: 0xf1f5ff, particle: 0xd71921 },
    cyber_gamer:    { tint: 0xfff8fb, rim: 0x00f5d4, ring: 0x00f5d4, wing: 0x00e5ff, fill: 0xe0f7fa, particle: 0x00f5d4 },
    mora_cyber:     { tint: 0xfaf7ff, rim: 0xff1e56, ring: 0x00f5d4, wing: 0x00f5d4, fill: 0xe0f2fe, particle: 0x00f5d4 },
    school_morning: { tint: 0xfffff8, rim: 0xf59e0b, ring: 0xf59e0b, wing: 0x38bdf8, fill: 0xfef3c7, particle: 0xf59e0b },
    morning_sun:    { tint: 0xfffff4, rim: 0xf59e0b, ring: 0xfbbf24, wing: 0xfbbf24, fill: 0xfef3c7, particle: 0xf59e0b },
    pastel_kawaii:  { tint: 0xfff4f8, rim: 0xff4d94, ring: 0xff5c9e, wing: 0xff66b3, fill: 0xffe4ef, particle: 0xff5c9e },
    sakura_pink:    { tint: 0xfff2f6, rim: 0xff4d94, ring: 0xff5c9e, wing: 0xff66b3, fill: 0xffe4ef, particle: 0xff5c9e },
    cozy_hoodie:    { tint: 0xf4faff, rim: 0x0ea5e9, ring: 0x38bdf8, wing: 0x38bdf8, fill: 0xe0f2fe, particle: 0x0ea5e9 },
    night_star:     { tint: 0xf0f4ff, rim: 0x6366f1, ring: 0x818cf8, wing: 0x818cf8, fill: 0xc7d2fe, particle: 0x818cf8 }
  };

  const ROOM_STAGES = {
    studio_white:    { bgCss: "", amb: 1.05, key: 0.95, rim: 1.05, keyCol: 0xffffff, ambCol: 0xffffff, theme: "nothing_white" },
    sunset_sakura:   { bgCss: "linear-gradient(180deg, rgba(255,228,234,0.72) 0%, rgba(254,215,170,0.52) 60%, rgba(255,255,255,0.85) 100%)", amb: 1.02, key: 0.98, rim: 1.25, keyCol: 0xffedd5, ambCol: 0xfff1f2, theme: "sakura_pink" },
    night_sanctuary: { bgCss: "linear-gradient(180deg, rgba(15,23,42,0.88) 0%, rgba(30,27,75,0.82) 65%, rgba(30,41,59,0.90) 100%)", amb: 0.92, key: 0.88, rim: 1.45, keyCol: 0xe0e7ff, ambCol: 0xc7d2fe, theme: "night_star" },
    neon_concert:    { bgCss: "linear-gradient(180deg, rgba(9,9,26,0.90) 0%, rgba(46,16,101,0.82) 55%, rgba(15,23,42,0.92) 100%)", amb: 0.95, key: 0.95, rim: 1.65, keyCol: 0xe0f2fe, ambCol: 0xf5d0fe, theme: "cyber_gamer" },
    cozy_bedroom:    { bgCss: "radial-gradient(ellipse at 50% 18%, rgba(255,236,220,.98), transparent 55%), linear-gradient(180deg,#f3d8cc 0%,#c99da0 48%,#6c5b70 100%)", amb: 0.86, key: 0.78, rim: 0.68, keyCol: 0xffd5b8, ambCol: 0xffe6d6, theme: "pastel_kawaii" }
  };

  let activeThemeKey = "nothing_white";

  let onTouchReactionCallback = null;
  let onHeadpatCallback = null;
  let onBodyPokeCallback = null;
  let onPetTapCallback = null;

  function resolveModelUrl(modelOrUrl) {
    if (!modelOrUrl) return "./models/mikumi_vita.vrm";
    // Legacy v4 alias support so older saved configs auto-upgrade to ultra-pretty Vita!
    if (modelOrUrl === "mikumi_cyber.vrm" || modelOrUrl === "mikumi.vrm") {
      return "./models/mikumi_vita.vrm";
    }
    if (
      modelOrUrl.startsWith("blob:") ||
      modelOrUrl.startsWith("http:") ||
      modelOrUrl.startsWith("https:") ||
      modelOrUrl.startsWith("./") ||
      modelOrUrl.startsWith("/")
    ) {
      return modelOrUrl;
    }
    return `./models/${modelOrUrl}`;
  }

  function loadVrmAnimationCached(url) {
    if (!VRMAnimationLoaderPlugin) return Promise.resolve(null);
    if (!vrmAnimCache.has(url)) {
      const p = new Promise((resolve) => {
        const loader = new GLTFLoader();
        loader.register(parser => new VRMAnimationLoaderPlugin(parser));
        loader.load(
          url,
          gltf => {
            const anim = gltf && gltf.userData && gltf.userData.vrmAnimations && gltf.userData.vrmAnimations[0];
            resolve(anim || null);
          },
          undefined,
          () => {
            vrmAnimCache.delete(url);
            resolve(null);
          }
        );
      });
      vrmAnimCache.set(url, p);
    }
    return vrmAnimCache.get(url);
  }

  async function init(domElement, options = {}) {
    container = domElement;
    isOverlayMode = !!(options.isOverlay || options.overlayMode);
    if (options.fpsLimit) targetFps = options.fpsLimit;
    onTouchReactionCallback = options.onTouchReaction || null;
    onHeadpatCallback = options.onHeadpat || null;
    onBodyPokeCallback = options.onBodyPoke || null;
    onPetTapCallback = options.onPetTap || null;

    const w = container.clientWidth || 365;
    const h = container.clientHeight || 435;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(33, w / h, 0.1, 35);
    if (isOverlayMode) {
      camera.position.set(0.06, 0.92, 3.00);
    } else {
      camera.position.set(0.08, 0.94, 3.24);
    }

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1.75, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Balanced Studio Anime Beauty Lighting (Rich skin tones, crisp white outfits, soft rose rim glow!)
    ambientLight = new THREE.AmbientLight(0xffffff, 1.05);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0xffffff, 0xf3e8ff, 0.55);
    scene.add(hemiLight);

    keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(0.38, 1.55, 3.8);
    scene.add(keyLight);

    fillLight = new THREE.DirectionalLight(0xf1f5ff, 0.55);
    fillLight.position.set(-1.8, 1.35, 1.6);
    scene.add(fillLight);

    rimLight = new THREE.DirectionalLight(0xd71921, 1.05);
    rimLight.position.set(0, 2.0, -2.2);
    scene.add(rimLight);

    lookAtTargetObj = new THREE.Object3D();
    lookAtTargetObj.position.set(0.08, 1.32, 3.24);
    scene.add(lookAtTargetObj);

    vrmRootHolder = new THREE.Group();
    vrmRootHolder.position.set(-0.11, 0, 0);
    scene.add(vrmRootHolder);

    petHolder = new THREE.Group();
    petHolder.position.set(0.40, 0, 0.20);
    petHolder.visible = options.showPet !== false;
    petOrbitMode = !!options.petOrbit;
    scene.add(petHolder);

    particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    buildAmbient3DAuraField();
    buildMoraMagicPlatform();
    buildFloatingAICoreOrb();
    buildCozyBedroom();

    if (!isOverlayMode) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0.07, 0.85, 0.0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.minDistance = 0.78;
      controls.maxDistance = 4.2;
      controls.maxPolarAngle = Math.PI * 0.64;
      controls.minPolarAngle = Math.PI * 0.22;
      controls.enablePan = false;
      controls.update();
    } else {
      camera.lookAt(0.07, 0.85, 0.0);
    }

    bindInteractions();
    window.addEventListener("resize", handleResize);
    requestAnimationFrame(animateLoop);

    const initVrm = options.vrmModel || "mikumi_vita.vrm";
    const initTheme = options.shaderTheme || "nothing_white";
    const initPet = options.petId || "pet_droid";

    // Pre-fetch primary idle + greeting mocap concurrently with VRM & Pet for instant 0-delay pose!
    await Promise.all([
      loadVrmAnimationCached(IDLE_POOL[0]),
      loadVrmAnimationCached("./anims/talking.vrma"),
      loadMikumiVRM(initVrm, initTheme, options.onProgress),
      loadPet3D(initPet, options.showPet !== false)
    ]);

    renderer.render(scene, camera);
    return true;
  }

  function buildCozyBedroom() {
    if (!scene || bedroomGroup) return;
    bedroomGroup = new THREE.Group();
    bedroomGroup.visible = false;
    const mat = (color, roughness = 0.86) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
    const wood = mat(0x9b6f69), paleWood = mat(0xc69b88), quilt = mat(0xd898a9), linen = mat(0xffe8e5), pillow = mat(0xfff4ef), gold = mat(0xe3b879);
    const box = (w,h,d,material,x,y,z, radius=0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
      mesh.position.set(x,y,z); bedroomGroup.add(mesh); return mesh;
    };
    // Decorative, non-interactive room dressing stays behind the avatar and pets.
    box(1.62,0.16,0.72,wood,-0.94,0.22,-1.05);
    box(1.52,0.20,0.62,linen,-0.94,0.38,-1.02);
    box(1.5,0.08,0.46,quilt,-0.94,0.51,-0.86);
    box(0.58,0.12,0.27,pillow,-1.27,0.53,-1.17);
    box(0.58,0.12,0.27,pillow,-0.64,0.53,-1.17);
    box(1.72,0.65,0.10,wood,-0.94,0.57,-1.43);
    box(0.48,0.50,0.42,paleWood,0.24,0.25,-1.12);
    box(0.52,0.055,0.46,wood,0.24,0.53,-1.12);
    box(0.12,0.25,0.12,gold,0.24,0.69,-1.12);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13,16,12), new THREE.MeshStandardMaterial({color:0xffdda1,emissive:0xffbb66,emissiveIntensity:0.45}));
    lamp.position.set(0.24,0.90,-1.12); bedroomGroup.add(lamp);
    // Window frame and glowing dusk pane.
    box(0.92,0.74,0.06,wood,0.98,1.24,-1.70);
    box(0.78,0.60,0.025,mat(0xc3d4ec,0.32),0.98,1.24,-1.65);
    box(0.035,0.68,0.035,linen,0.98,1.24,-1.61);
    box(0.88,0.035,0.035,linen,0.98,1.24,-1.61);
    scene.add(bedroomGroup);
  }

  function buildAmbient3DAuraField() {
    const geo = new THREE.BufferGeometry();
    ambientPositions = new Float32Array(AMBIENT_COUNT * 3);
    ambientSpeeds = new Float32Array(AMBIENT_COUNT);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.25 + Math.random() * 0.85;
      ambientPositions[i * 3] = Math.cos(angle) * rad;
      ambientPositions[i * 3 + 1] = Math.random() * 1.9;
      ambientPositions[i * 3 + 2] = Math.sin(angle) * rad;
      ambientSpeeds[i] = 0.08 + Math.random() * 0.20;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(ambientPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xd71921,
      size: isOverlayMode ? 0.022 : 0.028,
      transparent: true,
      opacity: 0.68
    });
    ambientPoints = new THREE.Points(geo, mat);
    scene.add(ambientPoints);
  }

  function buildMoraMagicPlatform() {
    holoPlatformGroup = new THREE.Group();
    holoPlatformGroup.position.set(-0.11, 0, 0);

    baseDiscMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.56, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: isOverlayMode ? 0.30 : 0.68, side: THREE.DoubleSide })
    );
    baseDiscMesh.rotation.x = -Math.PI / 2;
    baseDiscMesh.position.y = 0.002;
    holoPlatformGroup.add(baseDiscMesh);

    innerRuneRing = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.455, 6),
      new THREE.MeshBasicMaterial({ color: 0xd71921, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    innerRuneRing.rotation.x = -Math.PI / 2;
    innerRuneRing.position.y = 0.006;
    holoPlatformGroup.add(innerRuneRing);

    middleHexRing = new THREE.Mesh(
      new THREE.RingGeometry(0.50, 0.525, 3),
      new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    middleHexRing.rotation.x = -Math.PI / 2;
    middleHexRing.position.y = 0.007;
    holoPlatformGroup.add(middleHexRing);

    outerTechRing = new THREE.Mesh(
      new THREE.RingGeometry(0.57, 0.605, 48),
      new THREE.MeshBasicMaterial({ color: 0x111215, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
    );
    outerTechRing.rotation.x = -Math.PI / 2;
    outerTechRing.position.y = 0.005;
    holoPlatformGroup.add(outerTechRing);

    shockwaveRing = new THREE.Mesh(
      new THREE.RingGeometry(0.50, 0.56, 48),
      new THREE.MeshBasicMaterial({ color: 0xd71921, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    );
    shockwaveRing.rotation.x = -Math.PI / 2;
    shockwaveRing.position.y = 0.01;
    holoPlatformGroup.add(shockwaveRing);

    scene.add(holoPlatformGroup);

    petPadGroup = new THREE.Group();
    petPadGroup.position.set(0.40, 0.004, 0.20);
    const petDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.62, side: THREE.DoubleSide })
    );
    petDisc.rotation.x = -Math.PI / 2;
    petPadRing = new THREE.Mesh(
      new THREE.RingGeometry(0.21, 0.24, 6),
      new THREE.MeshBasicMaterial({ color: 0xd71921, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
    );
    petPadRing.rotation.x = -Math.PI / 2;
    petPadRing.position.y = 0.003;
    petPadGroup.add(petDisc, petPadRing);
    scene.add(petPadGroup);
  }

  function buildFloatingAICoreOrb() {
    aiOrbGroup = new THREE.Group();
    aiOrbGroup.position.set(-0.50, 1.15, 0.14);

    aiOrbCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.052, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xd71921,
        emissiveIntensity: 0.75,
        roughness: 0.15,
        metalness: 0.3
      })
    );
    aiOrbRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.084, 0.0055, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xd71921 })
    );
    aiOrbRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.106, 0.0045, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x111215, transparent: true, opacity: 0.5 })
    );
    aiOrbRing2.rotation.x = Math.PI / 3;

    aiOrbGroup.add(aiOrbCore, aiOrbRing1, aiOrbRing2);
    aiOrbGroup.visible = accessories.orb;
    scene.add(aiOrbGroup);
  }

  function attachCyberGearToMikumi(vrm) {
    if (accHeadsetGroup) scene.remove(accHeadsetGroup);
    if (accHaloGroup) scene.remove(accHaloGroup);
    if (accWingsContainer) scene.remove(accWingsContainer);

    accHeadsetGroup = null;
    accHaloGroup = null;
    accWingsContainer = null;
    accLeftWingPivot = null;
    accRightWingPivot = null;

    if (!vrm || !vrm.humanoid) return;

    const whiteGloss = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.25 });
    const darkCarbon = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.3, metalness: 0.45 });
    const redLed = new THREE.MeshBasicMaterial({ color: 0xd71921 });

    // 1. Optional 3D Nothing Cyber Headphones + Cat-Ear LED Horns
    accHeadsetGroup = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.011, 10, 28, Math.PI * 1.04), whiteGloss);
    band.position.set(0, 0.095, 0.0);
    band.rotation.z = -0.06;
    accHeadsetGroup.add(band);

    [-1, 1].forEach(side => {
      const cup = new THREE.Group();
      cup.position.set(side * 0.115, 0.072, 0.005);
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.025, 20), whiteGloss);
      shell.rotation.z = Math.PI / 2;
      const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 20), redLed);
      ledRing.rotation.y = Math.PI / 2;
      ledRing.position.x = side * 0.014;
      cup.add(shell, ledRing);
      accHeadsetGroup.add(cup);

      const ear = new THREE.Group();
      ear.position.set(side * 0.080, 0.198, 0.005);
      ear.rotation.z = -side * 0.32;
      const outerHorn = new THREE.Mesh(new THREE.ConeGeometry(0.033, 0.074, 4), whiteGloss);
      const innerGlow = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.050, 4), redLed);
      innerGlow.position.z = 0.012;
      ear.add(outerHorn, innerGlow);
      accHeadsetGroup.add(ear);
    });
    accHeadsetGroup.visible = accessories.headset;
    scene.add(accHeadsetGroup);

    // 2. Floating Nothing Glyph Angel Halo Above Crown
    accHaloGroup = new THREE.Group();
    const mainHalo = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.0068, 10, 36), redLed);
    mainHalo.rotation.x = Math.PI / 2;
    const outerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.0035, 8, 36), darkCarbon);
    outerHalo.rotation.x = Math.PI / 2;
    const starGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.020, 0), whiteGloss);
    starGem.position.set(0, 0.013, 0.118);
    accHaloGroup.add(mainHalo, outerHalo, starGem);
    accHaloGroup.visible = accessories.halo;
    scene.add(accHaloGroup);

    // 3. Articulated Crystal Valkyrie Energy Wings Behind Back
    accWingsContainer = new THREE.Group();
    const wingOuterMat = new THREE.MeshBasicMaterial({
      color: 0xd71921,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    const wingInnerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide
    });

    const buildSideWing = (dir) => {
      const pivot = new THREE.Group();
      pivot.position.set(dir * 0.09, 0, 0);
      const bladeSpecs = [
        { len: 0.42, ang: -1.12, yOff: 0.12 },
        { len: 0.36, ang: -1.36, yOff: 0.05 },
        { len: 0.29, ang: -1.60, yOff: -0.02 },
        { len: 0.22, ang: -1.84, yOff: -0.09 }
      ];
      bladeSpecs.forEach((sp, idx) => {
        const bladeHolder = new THREE.Group();
        bladeHolder.position.y = sp.yOff;
        bladeHolder.rotation.z = dir * sp.ang;

        const outerFeather = new THREE.Mesh(
          new THREE.ConeGeometry(0.040 - idx * 0.005, sp.len, 4),
          wingOuterMat
        );
        outerFeather.position.y = sp.len * 0.5 + 0.05;
        outerFeather.scale.set(1.0, 1.0, 0.18);

        const innerCore = new THREE.Mesh(
          new THREE.ConeGeometry(0.019 - idx * 0.002, sp.len * 0.78, 4),
          wingInnerCoreMat
        );
        innerCore.position.y = sp.len * 0.44 + 0.05;
        innerCore.position.z = 0.006;
        innerCore.scale.set(1.0, 1.0, 0.22);

        bladeHolder.add(outerFeather, innerCore);
        pivot.add(bladeHolder);
      });
      return pivot;
    };

    accLeftWingPivot = buildSideWing(-1);
    accRightWingPivot = buildSideWing(1);
    accWingsContainer.add(accLeftWingPivot, accRightWingPivot);
    accWingsContainer.visible = accessories.wings;
    accWingsContainer.userData.bladeMat = wingOuterMat;
    scene.add(accWingsContainer);
  }

  // Snapshot original per-joint SpringBone physics (Utsuwa pattern: idempotent physics tuning!)
  function snapshotSpringBones(vrm) {
    springSnapshot = [];
    const joints = vrm && vrm.springBoneManager && vrm.springBoneManager.joints;
    if (!joints) return;
    joints.forEach(joint => {
      if (joint && joint.settings) {
        springSnapshot.push({
          settings: joint.settings,
          stiffness: joint.settings.stiffness,
          gravityPower: joint.settings.gravityPower,
          dragForce: joint.settings.dragForce
        });
      }
    });
    applySpringIntensity();
  }

  function applySpringIntensity() {
    const k = Math.max(0.2, Math.min(2.0, springIntensity));
    springSnapshot.forEach(item => {
      // Higher intensity = softer drag & livelier anime hair/skirt sway without wild clipping
      item.settings.stiffness = item.stiffness * (0.75 + 0.25 * k);
      item.settings.dragForce = Math.max(0.08, item.dragForce / (0.55 + 0.45 * k));
      item.settings.gravityPower = item.gravityPower * (0.85 + 0.15 * k);
    });
  }

  function setSpringPhysics(intensity) {
    springIntensity = Number(intensity) || 1.0;
    applySpringIntensity();
  }

  async function startStudioIdleLoop(vrm, genToken, crossfade = false) {
    if (!createVRMAnimationClip || !vrm || genToken !== loadGeneration) return;
    const url = IDLE_POOL[idleIndex % IDLE_POOL.length];
    idleIndex++;
    const vrmAnim = await loadVrmAnimationCached(url);
    if (!vrmAnim || genToken !== loadGeneration || currentVrm !== vrm || !vrmMixer) return;

    const clip = createVRMAnimationClip(vrmAnim, vrm);
    const nextAction = vrmMixer.clipAction(clip);
    nextAction.setLoop(THREE.LoopRepeat, Infinity);

    if (crossfade && idleAction && idleAction !== nextAction) {
      idleAction.fadeOut(1.1);
      nextAction.reset().fadeIn(1.1).play();
    } else {
      nextAction.reset().play();
      // Settle SpringBones gently over 6 small sub-steps so hair & ribbons drape naturally on frame 1!
      for (let i = 0; i < 6; i++) {
        vrmMixer.update(0.025);
        vrm.update(0.025);
      }
    }
    idleAction = nextAction;

    if (idleCycleTimer) clearTimeout(idleCycleTimer);
    const delayMs = Math.max(7000, clip.duration * (1.2 + Math.random() * 0.8) * 1000);
    idleCycleTimer = setTimeout(() => {
      if (genToken !== loadGeneration) return;
      if (!speakingActive && !emoteActive && !photoFreeze) {
        startStudioIdleLoop(vrm, genToken, true);
      }
    }, delayMs);

    // Pre-bind expressive talking clip in background for 0ms lip+gesture sync!
    loadVrmAnimationCached("./anims/talking.vrma").then(talkAnim => {
      if (!talkAnim || genToken !== loadGeneration || currentVrm !== vrm || !vrmMixer) return;
      const tClip = createVRMAnimationClip(talkAnim, vrm);
      talkingAction = vrmMixer.clipAction(tClip);
      talkingAction.setLoop(THREE.LoopRepeat, Infinity);
    });
  }

  async function playMocapUrl(url, loopOnce = true) {
    if (!currentVrm || !vrmMixer || !createVRMAnimationClip) return false;
    const genToken = loadGeneration;
    const vrmAnim = await loadVrmAnimationCached(url);
    if (!vrmAnim || genToken !== loadGeneration || !currentVrm || !vrmMixer) return false;

    const clip = createVRMAnimationClip(vrmAnim, currentVrm);
    if (emoteAction) {
      emoteAction.fadeOut(0.28);
    }
    if (idleAction) idleAction.fadeOut(0.28);
    if (talkingAction && speakingActive) talkingAction.fadeOut(0.25);

    const act = vrmMixer.clipAction(clip);
    act.reset();
    if (loopOnce) {
      act.setLoop(THREE.LoopOnce, 1);
      act.clampWhenFinished = true;
    } else {
      act.setLoop(THREE.LoopRepeat, Infinity);
    }
    act.fadeIn(0.28).play();
    emoteAction = act;
    emoteActive = true;

    const finishDelay = Math.max(1200, (clip.duration - 0.30) * 1000);
    setTimeout(() => {
      if (genToken !== loadGeneration || emoteAction !== act) return;
      act.fadeOut(0.42);
      emoteActive = false;
      if (speakingActive && talkingAction) {
        talkingAction.reset().fadeIn(0.35).play();
      } else if (idleAction) {
        idleAction.enabled = true;
        idleAction.setEffectiveWeight(1);
        idleAction.fadeIn(0.42).play();
      }
    }, finishDelay);
    return true;
  }

  function loadMikumiVRM(modelOrUrl, themeKey, onProgress) {
    const url = resolveModelUrl(modelOrUrl);
    currentModelId = modelOrUrl || "mikumi_vita.vrm";
    if (themeKey) activeThemeKey = themeKey;
    const genToken = ++loadGeneration;

    if (idleCycleTimer) {
      clearTimeout(idleCycleTimer);
      idleCycleTimer = null;
    }

    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.register(parser => new VRMLoaderPlugin(parser));

      loader.load(
        url,
        async gltf => {
          if (genToken !== loadGeneration) { resolve(false); return; }

          if (currentVrm) {
            vrmRootHolder.clear();
            try { VRMUtils.deepDispose(currentVrm.scene); } catch (e) {}
            currentVrm = null;
          } else {
            vrmRootHolder.clear();
          }
          vrmMixer = null;
          idleAction = null;
          talkingAction = null;
          emoteAction = null;
          emoteActive = false;
          baseMaterials = [];

          const vrm = gltf.userData.vrm;
          if (vrm) {
            if (VRMUtils.removeUnnecessaryVertices) VRMUtils.removeUnnecessaryVertices(vrm.scene);
            if (VRMUtils.combineSkeletons) VRMUtils.combineSkeletons(vrm.scene);
            else if (VRMUtils.removeUnnecessaryJoints) VRMUtils.removeUnnecessaryJoints(vrm.scene);
            if (VRMUtils.rotateVRM0) VRMUtils.rotateVRM0(vrm);

            // Mandatory VRMLookAtQuaternionProxy so .vrma lookAt tracks bind cleanly!
            if (vrm.lookAt && VRMLookAtQuaternionProxy) {
              const existing = vrm.scene.getObjectByName("lookAtQuaternionProxy");
              if (!existing) {
                const proxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
                proxy.name = "lookAtQuaternionProxy";
                vrm.scene.add(proxy);
              }
              if (lookAtTargetObj) vrm.lookAt.target = lookAtTargetObj;
            }

            vrm.scene.traverse(obj => {
              obj.frustumCulled = false;
              if (obj.isMesh && obj.material) {
                (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => {
                  baseMaterials.push({ mat: m, origColor: m.color ? m.color.clone() : new THREE.Color(1, 1, 1) });
                });
              }
            });

            // Auto world-space bone polarity check (used only as instant pre-mocap fallback)
            const lSh = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
            const lHa = vrm.humanoid.getNormalizedBoneNode("leftHand");
            if (lSh && lHa) {
              lSh.rotation.set(0, 0, 1.0);
              vrm.update(0.001);
              vrm.scene.updateMatrixWorld(true);
              armDownSign = lHa.getWorldPosition(new THREE.Vector3()).y < lSh.getWorldPosition(new THREE.Vector3()).y ? 1 : -1;
              lSh.rotation.set(0, 0, 0);
            }

            // CRITICAL ARCHITECTURE: Keep vrm.scene.scale === (1,1,1) inside vrmNormGroup so
            // createVRMAnimationClip computes 100% unscaled rest-pose hip height (ZERO squat/stretch)!
            vrmNormGroup = new THREE.Group();
            vrmNormGroup.add(vrm.scene);
            vrm.update(0.016);
            vrmNormGroup.updateMatrixWorld(true);

            const box = new THREE.Box3();
            const childBox = new THREE.Box3();
            vrm.scene.traverse(obj => {
              if (!obj.isMesh || !obj.geometry || (obj.name && obj.name.startsWith("VRMC_springBone"))) return;
              if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
              childBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
              box.union(childBox);
            });
            const rawHeight = Math.max(0.5, box.max.y - box.min.y);
            const normScale = 1.54 / rawHeight;
            vrmNormGroup.scale.setScalar(normScale);
            vrmNormGroup.updateMatrixWorld(true);

            const alignedBox = new THREE.Box3().setFromObject(vrmNormGroup);
            vrmNormGroup.position.y -= alignedBox.min.y - 0.008;

            currentVrm = vrm;
            vrmRootHolder.add(vrmNormGroup);

            snapshotSpringBones(vrm);
            if (vrm.springBoneManager) vrm.springBoneManager.reset();

            vrmMixer = new THREE.AnimationMixer(vrm.scene);
            attachCyberGearToMikumi(vrm);
            applyShaderTheme(activeThemeKey);
            setEmotion("happy", 0.55);

            // Start real studio mocap idle right away so she NEVER stands in a stiff T-pose!
            await startStudioIdleLoop(vrm, genToken, false);
          } else if (gltf && gltf.scene) {
            normalizeObjectHeight(gltf.scene, 1.52, 0.008);
            vrmRootHolder.add(gltf.scene);
          }
          if (onProgress) onProgress(100);
          resolve(true);
        },
        xhr => {
          if (onProgress && xhr.total > 0) {
            onProgress(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
          }
        },
        err => {
          console.error("[MikumiStage3D] VRM load error:", err);
          resolve(false);
        }
      );
    });
  }

  function normalizeObjectHeight(obj3d, targetHeightMeters, groundY = 0.01) {
    obj3d.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj3d);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = Math.max(0.001, size.y);
    const s = targetHeightMeters / h;
    obj3d.scale.multiplyScalar(s);
    obj3d.updateMatrixWorld(true);

    const box2 = new THREE.Box3().setFromObject(obj3d);
    const center2 = new THREE.Vector3();
    box2.getCenter(center2);
    obj3d.position.x -= center2.x;
    obj3d.position.z -= center2.z;
    obj3d.position.y += (groundY - box2.min.y);
  }

  function loadPet3D(petKey, visible = true) {
    currentPetType = petKey || "pet_droid";
    petHolder.clear();
    petMixer = null;
    petActions = {};
    proceduralPet = null;
    petHolder.visible = visible;
    if (petPadGroup) petPadGroup.visible = visible;

    if (currentPetType === "pet_neko") {
      buildArticulated3DCyberNeko();
      return Promise.resolve(true);
    }
    if (currentPetType === "pet_dragon") {
      buildArticulated3DAstralDragon();
      return Promise.resolve(true);
    }

    const modelMap = {
      pet_droid:   { url: "./models/robot.glb", targetH: 0.50, groundY: 0.01, rotY: -0.35 },
      pet_fox:     { url: "./models/fox.glb",   targetH: 0.44, groundY: 0.01, rotY: -0.55 },
      pet_phoenix: { url: "./models/parrot.glb", targetH: 0.36, groundY: 0.96, rotY: -0.50 }
    };
    const cfg = modelMap[currentPetType] || modelMap.pet_droid;

    return new Promise((resolve) => {
      new GLTFLoader().load(
        cfg.url,
        gltf => {
          if (currentPetType !== petKey && modelMap[petKey]) { resolve(false); return; }
          const model = gltf.scene;
          model.traverse(o => { o.frustumCulled = false; });

          if (currentPetType === "pet_droid") {
            model.traverse(o => {
              if (o.isMesh && o.material) {
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                const mapped = mats.map(srcMat => {
                  const m = srcMat.clone();
                  const nm = ((srcMat.name || "") + " " + (o.name || "")).toLowerCase();
                  if (nm.includes("black") || nm.includes("eye") || nm.includes("visor")) {
                    m.color = new THREE.Color(0x111215);
                  } else if (nm.includes("grey") || nm.includes("antenna") || nm.includes("ear") || nm.includes("hand")) {
                    m.color = new THREE.Color(0xd71921);
                    if (m.emissive) m.emissive = new THREE.Color(0x45050a);
                  } else {
                    m.color = new THREE.Color(0xf8fafc);
                  }
                  return m;
                });
                o.material = Array.isArray(o.material) ? mapped : mapped[0];
              }
            });
          } else if (currentPetType === "pet_phoenix") {
            model.traverse(o => {
              if (o.isMesh && o.material) {
                const m = o.material.clone();
                m.emissive = new THREE.Color(0xff2a00);
                m.emissiveIntensity = 0.28;
                o.material = m;
              }
            });
          }

          normalizeObjectHeight(model, cfg.targetH, cfg.groundY);
          model.rotation.y = cfg.rotY;
          petHolder.add(model);

          if (gltf.animations && gltf.animations.length > 0) {
            petMixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach(clip => {
              petActions[clip.name] = petMixer.clipAction(clip);
            });
            playPetAnimation("idle");
          }
          resolve(true);
        },
        undefined,
        () => {
          buildArticulated3DCyberNeko();
          resolve(true);
        }
      );
    });
  }

  function buildArticulated3DCyberNeko() {
    const neko = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.12 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.2, metalness: 0.35 });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xd71921 });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.12, 12, 20), whiteMat);
    body.position.y = 0.19;
    neko.add(body);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.017, 10, 28), redGlowMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.27;
    neko.add(collar);

    const bell = new THREE.Mesh(new THREE.OctahedronGeometry(0.025, 0), cyanGlowMat);
    bell.position.set(0, 0.255, 0.118);
    neko.add(bell);

    const head = new THREE.Group();
    head.position.set(0, 0.40, 0.01);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), whiteMat);
    skull.scale.set(1.08, 0.96, 0.98);
    head.add(skull);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.138, 20, 16, -0.75, 1.5, 1.08, 0.74), darkMat);
    visor.rotation.y = Math.PI / 2;
    visor.position.z = 0.025;
    head.add(visor);

    const eyeGeo = new THREE.SphereGeometry(0.023, 12, 12);
    const leftEye = new THREE.Mesh(eyeGeo, cyanGlowMat);
    leftEye.position.set(-0.048, 0.006, 0.152);
    const rightEye = new THREE.Mesh(eyeGeo, cyanGlowMat);
    rightEye.position.set(0.048, 0.006, 0.152);
    head.add(leftEye, rightEye);

    [-1, 1].forEach(side => {
      const ear = new THREE.Group();
      ear.add(new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.115, 4), whiteMat));
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.078, 4), redGlowMat);
      inner.position.z = 0.016;
      ear.add(inner);
      ear.position.set(side * 0.098, 0.14, 0);
      ear.rotation.z = -side * 0.32;
      head.add(ear);
    });
    neko.add(head);

    const pawGeo = new THREE.SphereGeometry(0.04, 14, 14);
    const pawL = new THREE.Mesh(pawGeo, whiteMat);
    pawL.position.set(-0.095, 0.22, 0.105);
    const pawR = new THREE.Mesh(pawGeo, whiteMat);
    pawR.position.set(0.095, 0.22, 0.105);
    neko.add(pawL, pawR);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.14, -0.09);
    const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.024, 0.24, 12), whiteMat);
    tailMesh.position.set(0, 0.11, -0.05);
    tailMesh.rotation.x = -0.6;
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), redGlowMat);
    tailTip.position.set(0, 0.22, -0.12);
    tailPivot.add(tailMesh, tailTip);
    neko.add(tailPivot);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.008, 8, 32), redGlowMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.61;
    neko.add(halo);

    neko.rotation.y = -0.3;
    petHolder.add(neko);
    proceduralPet = { type: "neko", root: neko, head, tailPivot, pawL, pawR, halo };
  }

  function buildArticulated3DAstralDragon() {
    const dragon = new THREE.Group();
    dragon.position.y = 0.68;

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00bbf9,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.35
    });
    const redCoreMat = new THREE.MeshBasicMaterial({ color: 0xd71921 });
    const darkArmor = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.25, metalness: 0.5 });

    const chest = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), crystalMat);
    dragon.add(chest);

    const reactor = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), redCoreMat);
    reactor.position.set(0, 0, 0.095);
    dragon.add(reactor);

    const head = new THREE.Group();
    head.position.set(0, 0.14, 0.08);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.17, 5), crystalMat);
    snout.rotation.x = Math.PI * 0.45;
    head.add(snout);

    [-1, 1].forEach(side => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11, 4), redCoreMat);
      horn.position.set(side * 0.045, 0.06, -0.04);
      horn.rotation.x = -0.5;
      horn.rotation.z = -side * 0.3;
      head.add(horn);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), redCoreMat);
      eye.position.set(side * 0.042, 0.015, 0.045);
      head.add(eye);
    });
    dragon.add(head);

    const buildWyvernWing = dir => {
      const p = new THREE.Group();
      p.position.set(dir * 0.08, 0.04, -0.02);
      const mainBlade = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.30, 4), crystalMat);
      mainBlade.rotation.z = -dir * 1.15;
      mainBlade.position.set(dir * 0.14, 0.06, 0);
      mainBlade.scale.set(1, 1, 0.2);
      const subBlade = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.20, 4), redCoreMat);
      subBlade.rotation.z = -dir * 1.45;
      subBlade.position.set(dir * 0.11, -0.03, 0);
      subBlade.scale.set(1, 1, 0.2);
      p.add(mainBlade, subBlade);
      return p;
    };
    const wingL = buildWyvernWing(-1);
    const wingR = buildWyvernWing(1);
    dragon.add(wingL, wingR);

    const tailSegments = [];
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.052 - i * 0.008, 0),
        i === 4 ? redCoreMat : darkArmor
      );
      seg.position.set(0, -0.07 - i * 0.065, -0.06 - i * 0.045);
      dragon.add(seg);
      tailSegments.push(seg);
    }

    dragon.rotation.y = -0.35;
    petHolder.add(dragon);
    proceduralPet = { type: "dragon", root: dragon, head, wingL, wingR, tailSegments };
  }

  function playPetAnimation(kind) {
    if (kind === "jump" || kind === "trick" || kind === "spin" || kind === "dance") {
      petJumpVel = 2.9;
    }
    if (kind === "spin" || kind === "trick") {
      petSpin = Math.PI * 2;
    }
    if (!petMixer) return;
    Object.values(petActions).forEach(a => a.fadeOut(0.18));
    const chosen = (kind === "dance" || kind === "trick" || kind === "jump" || kind === "spin")
      ? (petActions["Dance"] || petActions["Jump"] || petActions["Wave"] || petActions["Run"] || Object.values(petActions)[0])
      : kind === "walk"
      ? (petActions["Walking"] || petActions["Walk"] || petActions["Running"] || Object.values(petActions)[0])
      : (petActions["Idle"] || petActions["Survey"] || petActions["Standing"] || Object.values(petActions)[0]);
    if (chosen) chosen.reset().fadeIn(0.2).play();
  }

  function setAccessory(name, enabled) {
    accessories[name] = !!enabled;
    if (name === "headset" && accHeadsetGroup) accHeadsetGroup.visible = accessories.headset;
    if (name === "halo" && accHaloGroup) accHaloGroup.visible = accessories.halo;
    if (name === "wings" && accWingsContainer) accWingsContainer.visible = accessories.wings;
    if (name === "orb" && aiOrbGroup) aiOrbGroup.visible = accessories.orb;
  }

  function setAvatarMoveMode(enabled) {
    avatarMoveMode = !!enabled;
    avatarDragPointer = null;
    if (controls) controls.enabled = !avatarMoveMode;
    return avatarMoveMode;
  }

  function setRoomStage(stageId) {
    activeStagePreset = ROOM_STAGES[stageId] ? stageId : "studio_white";
    const st = ROOM_STAGES[activeStagePreset];
    if (bedroomGroup) bedroomGroup.visible = activeStagePreset === "cozy_bedroom";
    if (container) {
      container.style.background = st.bgCss;
    }
    if (ambientLight) {
      ambientLight.intensity = st.amb;
      ambientLight.color.setHex(st.ambCol);
    }
    if (keyLight) {
      keyLight.intensity = st.key;
      keyLight.color.setHex(st.keyCol);
    }
    if (rimLight) {
      rimLight.intensity = st.rim;
    }
    applyShaderTheme(st.theme);
  }

  function applyShaderTheme(themeKey) {
    activeThemeKey = SHADER_THEMES[themeKey] ? themeKey : "nothing_white";
    const th = SHADER_THEMES[activeThemeKey];
    if (rimLight) rimLight.color.setHex(th.rim);
    if (fillLight) fillLight.color.setHex(th.fill);
    if (innerRuneRing) innerRuneRing.material.color.setHex(th.ring);
    if (petPadRing) petPadRing.material.color.setHex(th.ring);
    if (aiOrbCore) aiOrbCore.material.emissive.setHex(th.ring);
    if (aiOrbRing1) aiOrbRing1.material.color.setHex(th.ring);
    if (ambientPoints) ambientPoints.material.color.setHex(th.particle);
    if (accWingsContainer && accWingsContainer.userData.bladeMat) {
      accWingsContainer.userData.bladeMat.color.setHex(th.wing);
    }

    const tintCol = new THREE.Color(th.tint);
    baseMaterials.forEach(({ mat, origColor }) => {
      if (mat.color) mat.color.copy(origColor).multiply(tintCol);
    });
  }

  // YuriOS + Open-LLM-VTuber 10-Emotion Cubic Blendshape Controller
  // Never touches 'blink' or 'aa'/'ih'/'oh' mouth viseme channels!
  function setEmotion(emotionName, intensity = 1.0, resetAfterMs = 0) {
    const key = EMOTION_PALETTE[emotionName] ? emotionName : "happy";
    const spec = EMOTION_PALETTE[key];
    currentEmotionName = key;
    emotionProgress = 0;
    emotionDuration = Math.max(0.15, spec.blend);

    const managed = ["happy", "sad", "angry", "surprised", "relaxed", "ee", "blinkRight"];
    emotionStartVals = {};
    emotionTargetVals = {};

    const em = currentVrm && currentVrm.expressionManager;
    managed.forEach(ch => {
      let cur = 0;
      if (em && em.getValue) {
        try { cur = em.getValue(ch) || 0; } catch (e) {}
      }
      emotionStartVals[ch] = cur;
      emotionTargetVals[ch] = 0;
    });
    spec.expr.forEach(([ch, v]) => {
      emotionTargetVals[ch] = Math.max(0, Math.min(1, v * intensity));
    });

    if (emotionResetHandle) {
      clearTimeout(emotionResetHandle);
      emotionResetHandle = null;
    }
    if (resetAfterMs > 0) {
      emotionResetHandle = setTimeout(() => {
        setEmotion("happy", 0.36);
      }, resetAfterMs);
    }
  }

  function updateEmotionBlend(dt, em) {
    if (!em) return;
    if (emotionProgress < 1) {
      emotionProgress = Math.min(1, emotionProgress + dt / emotionDuration);
    }
    const ease = emotionProgress < 0.5
      ? 4 * emotionProgress * emotionProgress * emotionProgress
      : 1 - Math.pow(-2 * emotionProgress + 2, 3) / 2;

    Object.keys(emotionTargetVals).forEach(ch => {
      const a = emotionStartVals[ch] || 0;
      const b = emotionTargetVals[ch] || 0;
      setSafeExpr(em, ch, a + (b - a) * ease);
    });
  }

  function triggerShockwaveAndBurst(colorHex, count = 18) {
    shockwaveScale = 0.25;
    if (shockwaveRing) {
      shockwaveRing.material.color.setHex(colorHex);
      shockwaveRing.material.opacity = 0.92;
    }
    const geo = new THREE.OctahedronGeometry(0.030, 0);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 0.34 + Math.random() * 0.54;
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 }));
      m.position.set(
        -0.11 + Math.cos(angle) * 0.16,
        0.95 + Math.random() * 0.48,
        Math.sin(angle) * 0.16
      );
      m.userData.vel = new THREE.Vector3(Math.cos(angle) * speed, 0.38 + Math.random() * 0.5, Math.sin(angle) * speed);
      m.userData.life = 1.25;
      particlesGroup.add(m);
      activeParticles.push(m);
    }
  }

  function triggerDuoCombo() {
    petSpin = Math.PI * 2;
    petJumpVel = 3.2;
    currentAction = "mora_cyber";
    actionTimer = 5.0;
    applyShaderTheme("cyber_gamer");
    setEmotion("playful", 1.0, 5000);
    playMocapUrl("./anims/dance.vrma", true);
    playPetAnimation("dance");
    triggerShockwaveAndBurst(0x00f5d4, 28);
  }

  function trigger3DAction(actionName, durationSec = 3.5) {
    if (actionName === "duo_combo") {
      triggerDuoCombo();
      return;
    }
    currentAction = actionName;
    actionTimer = durationSec;

    // Map emotions + particle effects + real .vrma motion-capture clips!
    if (actionName === "wave" || actionName === "greeting") {
      setEmotion("happy", 0.95, 4000);
      playMocapUrl(MOCAP_MAP.wave, true);
      triggerShockwaveAndBurst(0xd71921, 14);
    } else if (actionName === "good_morning") {
      applyShaderTheme("morning_sun");
      setEmotion("happy", 1.0, 4500);
      playMocapUrl(MOCAP_MAP.good_morning, true);
      triggerShockwaveAndBurst(0xf59e0b, 22);
      playPetAnimation("trick");
    } else if (actionName === "good_night") {
      applyShaderTheme("night_star");
      setEmotion("tender", 1.0, 5000);
      playMocapUrl(MOCAP_MAP.good_night, true);
      triggerShockwaveAndBurst(0x818cf8, 16);
    } else if (actionName === "mora_cyber") {
      applyShaderTheme("mora_cyber");
      setEmotion("playful", 1.0, 4500);
      playMocapUrl(MOCAP_MAP.mora_cyber, true);
      triggerShockwaveAndBurst(0x00f5d4, 26);
      playPetAnimation("trick");
    } else if (actionName === "spin") {
      setEmotion("happy", 0.95, 3800);
      playMocapUrl(MOCAP_MAP.spin, true);
      triggerShockwaveAndBurst(0xd71921, 18);
    } else if (actionName === "peace" || actionName === "heart") {
      setEmotion("wink", 1.0, 4200);
      playMocapUrl(MOCAP_MAP.peace, true);
      triggerShockwaveAndBurst(0xff4d94, 20);
    } else if (actionName === "shoot") {
      setEmotion("playful", 1.0, 4000);
      playMocapUrl(MOCAP_MAP.shoot, true);
      triggerShockwaveAndBurst(0xff2a55, 22);
    } else if (actionName === "pose" || actionName === "model_pose") {
      setEmotion("shy", 1.0, 4200);
      playMocapUrl(MOCAP_MAP.pose, true);
      triggerShockwaveAndBurst(0xf59e0b, 16);
    } else if (actionName === "dance" || actionName === "gamer") {
      setEmotion("happy", 1.0, 6000);
      playMocapUrl(MOCAP_MAP.dance, true);
      triggerShockwaveAndBurst(0x00f5d4, 24);
      playPetAnimation("dance");
    } else if (actionName === "headpat") {
      setEmotion("tender", 1.0, 3600);
      playMocapUrl(MOCAP_MAP.headpat, true);
      triggerShockwaveAndBurst(0xff4d94, 20);
    } else if (actionName === "funny") {
      setEmotion("surprised", 0.9, 3200);
      playMocapUrl(MOCAP_MAP.shoot, true);
      triggerShockwaveAndBurst(0xf59e0b, 14);
    } else if (MOCAP_MAP[actionName]) {
      playMocapUrl(MOCAP_MAP[actionName], true);
    }
  }

  function attachAudioAnalyser(analyserNode) {
    audioAnalyser = analyserNode;
    if (audioAnalyser) {
      freqBins = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
  }

  function setSpeakingState(isSpeaking) {
    const changed = speakingActive !== !!isSpeaking;
    speakingActive = !!isSpeaking;

    if (changed && vrmMixer && !emoteActive) {
      if (speakingActive && talkingAction) {
        if (idleAction) idleAction.fadeOut(0.28);
        talkingAction.reset().fadeIn(0.28).play();
      } else if (!speakingActive) {
        if (talkingAction) talkingAction.fadeOut(0.35);
        if (idleAction) {
          idleAction.enabled = true;
          idleAction.setEffectiveWeight(1);
          idleAction.fadeIn(0.35).play();
        }
      }
    }

    if (!speakingActive) {
      liveVoiceEnergy = 0;
      if (currentVrm && currentVrm.expressionManager) {
        ["aa", "ih", "ou", "ee", "oh"].forEach(v => {
          try { currentVrm.expressionManager.setValue(v, 0); } catch (e) {}
        });
      }
    }
  }

  // 3D Photo Booth Studio Capture (Polaroid Card or Transparent PNG!)
  function capturePhoto(opts = {}) {
    if (!renderer || !scene || !camera) return null;
    const transparent = !!opts.transparent;
    const prevPlatVis = holoPlatformGroup ? holoPlatformGroup.visible : true;
    const prevPointsVis = ambientPoints ? ambientPoints.visible : true;

    if (transparent) {
      if (holoPlatformGroup) holoPlatformGroup.visible = false;
      if (ambientPoints) ambientPoints.visible = false;
    }
    renderer.render(scene, camera);
    const srcCanvas = renderer.domElement;

    if (transparent) {
      const dataUrl = srcCanvas.toDataURL("image/png");
      if (holoPlatformGroup) holoPlatformGroup.visible = prevPlatVis;
      if (ambientPoints) ambientPoints.visible = prevPointsVis;
      renderer.render(scene, camera);
      return dataUrl;
    }

    // Compose high-res Studio Polaroid Keepsake Card!
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const pad = Math.round(w * 0.055);
    const footer = Math.round(h * 0.16);
    const out = document.createElement("canvas");
    out.width = w + pad * 2;
    out.height = h + pad + footer;
    const ctx = out.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);

    // Subtle pastel studio backdrop behind transparent WebGL render
    const grad = ctx.createLinearGradient(0, pad, 0, pad + h);
    if (activeStagePreset === "night_sanctuary" || activeStagePreset === "neon_concert") {
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(0.6, "#1e1b4b");
      grad.addColorStop(1, "#312e81");
    } else if (activeStagePreset === "sunset_sakura") {
      grad.addColorStop(0, "#ffe4e6");
      grad.addColorStop(0.6, "#fed7aa");
      grad.addColorStop(1, "#fff1f2");
    } else {
      grad.addColorStop(0, "#f8fafc");
      grad.addColorStop(0.65, "#fff1f5");
      grad.addColorStop(1, "#f1f5f9");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(pad, pad, w, h);
    ctx.drawImage(srcCanvas, pad, pad, w, h);

    // Nothing OS + Kawaii Signature Caption Footer
    ctx.fillStyle = "#111215";
    ctx.font = `700 ${Math.max(18, Math.round(w * 0.036))}px sans-serif`;
    const title = opts.caption || "MIKUMI 3D OMEGA v5.0 • STUDIO SNAP";
    ctx.fillText(title, pad, pad + h + Math.round(footer * 0.48));

    ctx.fillStyle = "#d71921";
    ctx.font = `600 ${Math.max(13, Math.round(w * 0.025))}px monospace`;
    const sub = opts.sub || `${new Date().toLocaleDateString()} • Nothing Phone (3a) Studio`;
    ctx.fillText(sub, pad, pad + h + Math.round(footer * 0.78));

    return out.toDataURL("image/png");
  }

  function setSafeExpr(em, name, val) {
    if (!em) return;
    try { em.setValue(name, Math.max(0, Math.min(1, val))); } catch (e) {}
  }

  function updateVrmKinematics(t, dt) {
    if (!currentVrm || !currentVrm.humanoid) return;

    const h = currentVrm.humanoid;
    const em = currentVrm.expressionManager;

    // 1. Advance Studio .VRMA Motion Capture Skeleton Mixer FIRST!
    if (vrmMixer && !photoFreeze) {
      vrmMixer.update(dt);
    } else if (!idleAction) {
      // Gentle pre-mocap fallback only during the initial <150ms before idle_1.vrma settles
      const S = armDownSign;
      const lSh = h.getNormalizedBoneNode("leftUpperArm");
      const rSh = h.getNormalizedBoneNode("rightUpperArm");
      if (lSh) lSh.rotation.set(0.06, 0, -1.25 * S);
      if (rSh) rSh.rotation.set(0.06, 0, 1.25 * S);
    }

    if (actionTimer > 0) {
      actionTimer -= dt;
      if (actionTimer <= 0) currentAction = "idle";
    }

    // 2. Saccadic Eye-Gaze Micro-Movements (YuriOS + Airi organic gaze!)
    saccadeTimer += dt;
    if (saccadeTimer >= nextSaccadeAt) {
      saccadeTimer = 0;
      nextSaccadeAt = 0.7 + Math.random() * 2.2;
      saccadeOffset.set((Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.16);
    }
    smoothGaze.lerp(pointerNDC, Math.min(1, dt * 6.5));
    if (lookAtTargetObj && camera) {
      lookAtTargetObj.position.set(
        camera.position.x + smoothGaze.x * 0.55 + saccadeOffset.x,
        camera.position.y + smoothGaze.y * 0.35 + saccadeOffset.y,
        camera.position.z
      );
    }

    // Subtle additive head responsiveness toward user touch/pointer
    const head = h.getNormalizedBoneNode("head");
    const chest = h.getNormalizedBoneNode("chest");
    if (head && !emoteActive) {
      head.rotation.y += smoothGaze.x * 0.14;
      head.rotation.x += -smoothGaze.y * 0.08;
    }

    // 3. Cubic-Eased 10-Emotion Blendshape Channel
    updateEmotionBlend(dt, em);

    // 4. Natural Human Blinking Channel
    blinkTimer -= dt;
    if (blinkTimer <= 0 && !isBlinking) {
      isBlinking = true;
      blinkProgress = 0;
      blinkTimer = 2.4 + Math.random() * 3.0;
    }
    if (isBlinking && currentEmotionName !== "wink") {
      blinkProgress += dt * 9.5;
      const bVal = blinkProgress < 1 ? blinkProgress : Math.max(0, 2 - blinkProgress);
      setSafeExpr(em, "blink", bVal);
      if (blinkProgress >= 2) {
        isBlinking = false;
        setSafeExpr(em, "blink", 0);
      }
    }

    // 5. Real Multi-Formant Voice Lip-Sync + AI Core Resonance!
    if (speakingActive) {
      let mouthOpen = 0, mouthSpread = 0, mouthRound = 0;
      if (audioAnalyser && freqBins) {
        audioAnalyser.getByteFrequencyData(freqBins);
        let lowSum = 0, midSum = 0;
        for (let i = 2; i < 12; i++) lowSum += freqBins[i];
        for (let i = 12; i < 32; i++) midSum += freqBins[i];
        const lowAvg = lowSum / (10 * 255);
        const midAvg = midSum / (20 * 255);
        mouthOpen = Math.min(0.92, lowAvg * 2.15);
        mouthSpread = Math.min(0.72, midAvg * 1.9);
        mouthRound = Math.min(0.62, Math.max(0, lowAvg - midAvg) * 2.0);
      } else {
        speakFallbackPhase += dt * 13.0;
        mouthOpen = Math.max(0, Math.sin(speakFallbackPhase) * 0.70);
        mouthSpread = Math.max(0, Math.cos(speakFallbackPhase * 0.77) * 0.40);
        mouthRound = Math.max(0, Math.sin(speakFallbackPhase * 0.53 + 1.0) * 0.42);
      }
      liveVoiceEnergy = mouthOpen;
      setSafeExpr(em, "aa", mouthOpen);
      setSafeExpr(em, "ih", mouthSpread * 0.72);
      setSafeExpr(em, "oh", mouthRound);
    } else {
      liveVoiceEnergy *= 0.85;
    }

    if (spinAngle > 0.01) {
      const step = Math.min(spinAngle, dt * 8.0);
      vrmRootHolder.rotation.y += step;
      spinAngle -= step;
      if (spinAngle <= 0.01) vrmRootHolder.rotation.y = 0;
    }

    // Update VRM Expressions, LookAt & SpringBone Hair/Skirt Physics
    currentVrm.update(photoFreeze ? 0 : dt);
    currentVrm.scene.updateMatrixWorld(true);

    // 6. Sync World-Space 3D Halo, Optional Headset & Crystal Valkyrie Wings 1:1 to Moving Bones!
    const tmpPos = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion();
    if (head) {
      head.getWorldPosition(tmpPos);
      head.getWorldQuaternion(tmpQuat);
      if (accHeadsetGroup) {
        accHeadsetGroup.position.copy(tmpPos);
        accHeadsetGroup.quaternion.copy(tmpQuat);
        accHeadsetGroup.scale.setScalar(modelScale);
      }
      if (accHaloGroup) {
        accHaloGroup.position.set(tmpPos.x, tmpPos.y + (0.26 + Math.sin(t * 2.6) * 0.014) * modelScale, tmpPos.z);
        accHaloGroup.rotation.y = t * 1.35;
        accHaloGroup.scale.setScalar(modelScale);
      }
    }
    if (chest && accWingsContainer) {
      chest.getWorldPosition(tmpPos);
      accWingsContainer.position.set(tmpPos.x, tmpPos.y + 0.08 * modelScale, tmpPos.z - 0.14 * modelScale);
      accWingsContainer.rotation.y = vrmRootHolder.rotation.y;
      accWingsContainer.scale.setScalar(modelScale);
      if (accLeftWingPivot && accRightWingPivot) {
        const wingSpeed = emoteActive ? 5.6 : 2.3;
        const wingAmp = emoteActive ? 0.30 : 0.14;
        const flap = Math.sin(t * wingSpeed) * wingAmp;
        accLeftWingPivot.rotation.y = 0.22 + flap;
        accRightWingPivot.rotation.y = -0.22 - flap;
      }
    }
  }

  function updatePetKinematics(t, dt) {
    if (petMixer && !photoFreeze) petMixer.update(dt);

    if (petJumpVel !== 0 || petJumpY > 0) {
      petJumpY += petJumpVel * dt;
      petJumpVel -= 7.8 * dt;
      if (petJumpY <= 0) { petJumpY = 0; petJumpVel = 0; }
    }
    if (petSpin > 0.01) {
      const s = Math.min(petSpin, dt * 9.5);
      petHolder.rotation.y += s;
      petSpin -= s;
    }

    if (currentPetType === "pet_phoenix") {
      const angle = t * 1.15;
      petHolder.position.set(-0.11 + Math.cos(angle) * 0.46, petJumpY + Math.sin(t * 2.5) * 0.06, Math.sin(angle) * 0.34);
      petHolder.rotation.y = -angle + Math.PI * 0.5;
    } else if (petOrbitMode) {
      const angle = t * 1.45;
      const px = -0.11 + Math.cos(angle) * 0.52;
      const pz = Math.sin(angle) * 0.42;
      petHolder.position.set(px, petJumpY, pz);
      petHolder.rotation.y = -angle;
      if (petPadGroup) petPadGroup.position.set(px, 0.004, pz);
    } else {
      petHolder.position.set(0.40, petJumpY, 0.20);
      if (petPadGroup) petPadGroup.position.set(0.40, 0.004, 0.20);
    }

    if (proceduralPet && proceduralPet.type === "neko") {
      proceduralPet.root.position.y = Math.sin(t * 2.8) * 0.025;
      proceduralPet.tailPivot.rotation.z = Math.sin(t * 5.2) * 0.44;
      proceduralPet.head.rotation.z = Math.sin(t * 1.9) * 0.09;
      proceduralPet.head.rotation.y = smoothGaze.x * 0.3;
      proceduralPet.halo.position.y = 0.61 + Math.sin(t * 3.4) * 0.018;
      proceduralPet.pawL.position.y = 0.22 + Math.sin(t * 4.0) * 0.02;
      proceduralPet.pawR.position.y = 0.22 + Math.cos(t * 4.0) * 0.02;
    } else if (proceduralPet && proceduralPet.type === "dragon") {
      proceduralPet.root.position.y = 0.66 + Math.sin(t * 3.0) * 0.055;
      const flap = Math.sin(t * 7.2) * 0.42;
      proceduralPet.wingL.rotation.z = flap;
      proceduralPet.wingR.rotation.z = -flap;
      proceduralPet.head.rotation.y = smoothGaze.x * 0.25;
      proceduralPet.tailSegments.forEach((seg, idx) => {
        seg.position.x = Math.sin(t * 5.5 - idx * 0.7) * (0.025 + idx * 0.012);
      });
    }
  }

  function animateLoop(nowMs) {
    requestAnimationFrame(animateLoop);
    if (!running || !renderer) return;

    const minInterval = 1000 / targetFps;
    if (nowMs - lastFrameMs < minInterval * 0.88) return;
    lastFrameMs = nowMs;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    frameCounter++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      measuredFps = Math.min(targetFps, Math.max(24, Math.round(frameCounter / fpsTimer)));
      frameCounter = 0;
      fpsTimer = 0;
    }

    updateVrmKinematics(t, dt);
    updatePetKinematics(t, dt);

    if (aiOrbGroup && aiOrbGroup.visible) {
      aiOrbGroup.position.y = 1.15 + Math.sin(t * 2.4) * 0.045;
      const pulse = 1.0 + liveVoiceEnergy * 0.45;
      aiOrbCore.scale.setScalar(pulse);
      aiOrbCore.rotation.y = t * 1.8;
      aiOrbRing1.rotation.x = t * 2.2;
      aiOrbRing1.rotation.y = t * 1.4;
      aiOrbRing2.rotation.z = -t * 1.9;
    }

    if (ambientPoints && ambientPositions) {
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        ambientPositions[i * 3 + 1] += ambientSpeeds[i] * dt;
        if (ambientPositions[i * 3 + 1] > 2.0) ambientPositions[i * 3 + 1] = 0.02;
      }
      ambientPoints.geometry.attributes.position.needsUpdate = true;
      ambientPoints.rotation.y = t * 0.12;
    }

    if (innerRuneRing) innerRuneRing.rotation.z = t * 0.65;
    if (middleHexRing) middleHexRing.rotation.z = -t * 0.95;
    if (outerTechRing) outerTechRing.rotation.z = -t * 0.30;
    if (petPadRing) petPadRing.rotation.z = -t * 0.80;

    if (shockwaveRing && shockwaveScale > 0) {
      shockwaveScale += dt * 1.95;
      shockwaveRing.scale.set(shockwaveScale, shockwaveScale, 1);
      shockwaveRing.material.opacity = Math.max(0, 1.4 - shockwaveScale);
      if (shockwaveScale >= 1.45) shockwaveScale = 0;
    }

    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.position.addScaledVector(p.userData.vel, dt);
      p.rotation.x += dt * 4;
      p.rotation.y += dt * 5;
      p.userData.life -= dt * 0.85;
      p.material.opacity = Math.max(0, p.userData.life);
      if (p.userData.life <= 0) {
        particlesGroup.remove(p);
        activeParticles.splice(i, 1);
      }
    }

    if (camGlideFrames > 0 && controls) {
      camera.position.lerp(desiredCamPos, 0.14);
      controls.target.lerp(desiredTarget, 0.14);
      camGlideFrames--;
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  function bindInteractions() {
    let downPos = { x: 0, y: 0 };

    const updatePointer = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    renderer.domElement.addEventListener("pointermove", e => {
      updatePointer(e.clientX, e.clientY);
      if (avatarMoveMode && avatarDragPointer && vrmRootHolder) {
        const rect = renderer.domElement.getBoundingClientRect();
        vrmRootHolder.position.x += (e.clientX - avatarDragPointer.x) / Math.max(1, rect.width) * 2.4;
        vrmRootHolder.position.y -= (e.clientY - avatarDragPointer.y) / Math.max(1, rect.height) * 2.4;
        avatarDragPointer = { x: e.clientX, y: e.clientY };
      }
    });
    renderer.domElement.addEventListener("pointerdown", e => {
      downPos = { x: e.clientX, y: e.clientY };
      updatePointer(e.clientX, e.clientY);
      if (avatarMoveMode) {
        avatarDragPointer = { x: e.clientX, y: e.clientY };
        renderer.domElement.setPointerCapture?.(e.pointerId);
      }
    });

    renderer.domElement.addEventListener("pointerup", e => {
      if (avatarMoveMode) { avatarDragPointer = null; return; }
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 10) return;

      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNDC, camera);

      if (petHolder.visible && raycaster.intersectObject(petHolder, true).length > 0) {
        playPetAnimation("trick");
        triggerShockwaveAndBurst(0x00f5d4, 14);
        if (onTouchReactionCallback) onTouchReactionCallback("pet");
        if (onPetTapCallback) onPetTapCallback();
        return;
      }

      if (vrmRootHolder) {
        const hits = raycaster.intersectObject(vrmRootHolder, true);
        if (hits.length > 0) {
          const hitY = hits[0].point.y / modelScale;
          if (hitY > 1.18) {
            trigger3DAction("headpat", 3.2);
            if (onTouchReactionCallback) onTouchReactionCallback("head");
            if (onHeadpatCallback) onHeadpatCallback();
          } else {
            trigger3DAction("funny", 2.8);
            if (onTouchReactionCallback) onTouchReactionCallback("body");
            if (onBodyPokeCallback) onBodyPokeCallback();
          }
        }
      }
    });
  }

  function setCameraPreset(mode) {
    if (!camera) return;
    if (mode === "face") {
      desiredCamPos.set(-0.11, 1.36, 1.12);
      desiredTarget.set(-0.11, 1.32, 0.0);
    } else if (mode === "bust") {
      desiredCamPos.set(-0.06, 1.22, 1.96);
      desiredTarget.set(-0.08, 1.14, 0.0);
    } else if (mode === "side") {
      desiredCamPos.set(1.32, 1.04, 2.48);
      desiredTarget.set(0.02, 0.86, 0.0);
    } else if (mode === "pet") {
      desiredCamPos.set(0.42, 0.42, 1.30);
      desiredTarget.set(0.40, 0.26, 0.20);
    } else {
      desiredCamPos.set(0.08, 0.94, 3.24);
      desiredTarget.set(0.07, 0.85, 0.0);
    }
    camGlideFrames = 30;
  }

  function setWaifuScale(percent) {
    modelScale = percent / 100;
    if (vrmRootHolder) vrmRootHolder.scale.setScalar(modelScale);
  }

  function setPetVisible(vis) {
    if (petHolder) petHolder.visible = vis;
    if (petPadGroup) petPadGroup.visible = vis;
  }

  function setPetOrbit(orbit) {
    petOrbitMode = orbit;
    playPetAnimation(orbit ? "walk" : "idle");
  }

  function setPhotoFreeze(freeze) {
    photoFreeze = !!freeze;
  }

  function setPaused(paused) {
    running = !paused;
  }

  function setFpsLimit(fps) {
    targetFps = fps || 60;
  }

  function setPowerMode(active, fpsLimit = 60) {
    running = active;
    targetFps = fpsLimit;
  }

  function getStats() {
    return {
      fps: running ? measuredFps : 0,
      hasVrm: !!currentVrm,
      modelId: currentModelId,
      petType: currentPetType,
      emotion: currentEmotionName,
      stage: activeStagePreset
    };
  }

  function handleResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth || 365;
    const h = container.clientHeight || 435;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  return {
    init,
    loadMikumiVRM,
    loadWaifuModel: (url, theme) => loadMikumiVRM(url, theme),
    loadPet3D,
    loadPetModel: (petKey) => loadPet3D(petKey, true),
    playMocapUrl,
    setAccessory,
    getAccessories: () => ({ ...accessories }),
    setRoomStage,
    setAvatarMoveMode,
    applyShaderTheme,
    setEmotion,
    setSpringPhysics,
    capturePhoto,
    setPhotoFreeze,
    playAnimation: trigger3DAction,
    trigger3DAction,
    triggerDuoCombo,
    triggerPetTrick: playPetAnimation,
    playPetAnimation,
    attachAudioAnalyser,
    setSpeaking: setSpeakingState,
    setSpeakingState,
    setCameraPreset,
    setWaifuScale,
    setPetVisible,
    setPetOrbit,
    setPaused,
    setFpsLimit,
    setPowerMode,
    getStats,
    resize: handleResize,
    handleResize
  };
})();
