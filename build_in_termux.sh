#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=========================================================="
echo "  MIKUMI 3D OMEGA v5.0 — ANDROID 14/15 ARM64 APK BUILDER  "
echo "  Target: White Nothing Phone (3a) • Nothing OS 3.1       "
echo "=========================================================="

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$PROJECT_DIR/build_out"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen" "$BUILD_DIR/classes" "$BUILD_DIR/dex" "$BUILD_DIR/res_flat"

if ! command -v aapt2 >/dev/null 2>&1 || ! command -v d8 >/dev/null 2>&1; then
  if command -v pkg >/dev/null 2>&1; then
    echo "[1/6] Installing Termux ARM64 compiler packages..."
    pkg update -y
    pkg install -y openjdk-17 aapt2 dx apksigner android-tools wget unzip
  elif command -v sudo >/dev/null 2>&1; then
    echo "[1/6] Installing Linux Android SDK build toolchain..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq default-jdk-headless wget unzip zip
    if ! command -v d8 >/dev/null 2>&1; then
      mkdir -p /var/tmp/build_tools
      wget -q -O /var/tmp/build_tools/bt.zip https://dl.google.com/android/repository/build-tools_r35_linux.zip
      unzip -q -o /var/tmp/build_tools/bt.zip -d /var/tmp/build_tools
      BT_SUB="$(find /var/tmp/build_tools -mindepth 1 -maxdepth 1 -type d | head -n 1)"
      sudo ln -sf "$BT_SUB/d8" /usr/local/bin/d8
      sudo ln -sf "$BT_SUB/aapt2" /usr/local/bin/aapt2
      sudo ln -sf "$BT_SUB/zipalign" /usr/local/bin/zipalign
      sudo ln -sf "$BT_SUB/apksigner" /usr/local/bin/apksigner
    fi
  fi
fi

ANDROID_JAR=""
for candidate in \
  "$ANDROID_HOME/platforms/android-34/android.jar" \
  "$PREFIX/share/aapt/android.jar" \
  "$PREFIX/share/java/android.jar" \
  "$PROJECT_DIR/tools/android.jar"; do
  if [ -f "$candidate" ]; then
    ANDROID_JAR="$candidate"
    break
  fi
done

if [ -z "$ANDROID_JAR" ]; then
  mkdir -p "$PROJECT_DIR/tools"
  wget -q --show-progress -O "$PROJECT_DIR/tools/platform34.zip" \
    "https://dl.google.com/android/repository/platform-34-ext7_r02.zip"
  unzip -p "$PROJECT_DIR/tools/platform34.zip" "*/android.jar" \
    > "$PROJECT_DIR/tools/android.jar"
  rm -f "$PROJECT_DIR/tools/platform34.zip"
  ANDROID_JAR="$PROJECT_DIR/tools/android.jar"
fi

echo "[2/6] Compiling resources via aapt2..."
aapt2 compile --dir "$PROJECT_DIR/app/src/main/res" -o "$BUILD_DIR/res_flat/res.zip"

echo "[3/6] Linking with explicit Android 14/15 SDK targets (minSdk=26, targetSdk=34)..."
aapt2 link \
  -o "$BUILD_DIR/mikumi-unaligned.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$PROJECT_DIR/app/src/main/AndroidManifest.xml" \
  --min-sdk-version 26 \
  --target-sdk-version 34 \
  -A "$PROJECT_DIR/app/src/main/assets" \
  -0 vrm -0 vrma -0 glb -0 mp3 -0 arsc \
  --java "$BUILD_DIR/gen" \
  --auto-add-overlay \
  "$BUILD_DIR/res_flat/res.zip"

echo "[4/6] Compiling Java native bridges (ai.mikumi.omega)..."
find "$PROJECT_DIR/app/src/main/java" "$BUILD_DIR/gen" -name "*.java" > "$BUILD_DIR/sources.txt"
javac -encoding UTF-8 -source 11 -target 11 -classpath "$ANDROID_JAR" -d "$BUILD_DIR/classes" @"$BUILD_DIR/sources.txt"

echo "[5/6] Dexing bytecode with d8 (--min-api 26)..."
find "$BUILD_DIR/classes" -name "*.class" > "$BUILD_DIR/classes.txt"
d8 --min-api 26 --lib "$ANDROID_JAR" --output "$BUILD_DIR/dex" @"$BUILD_DIR/classes.txt"
(cd "$BUILD_DIR/dex" && zip -q "$BUILD_DIR/mikumi-unaligned.apk" classes.dex)

KEYSTORE="$PROJECT_DIR/mikumi-release.keystore"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias mikumi_key \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass mikumi2026 -keypass mikumi2026 \
    -dname "CN=Mikumi Hyper 3D, OU=AI, O=MikumiOmega, L=Colombo, S=WP, C=LK"
fi

echo "[6/6] Page-aligning & V1+V2+V3 signing Mikumi-3D-Omega-v5.0.apk..."
zipalign -f -p 4 "$BUILD_DIR/mikumi-unaligned.apk" "$BUILD_DIR/mikumi-aligned.apk"
FINAL_APK="$PROJECT_DIR/Mikumi-3D-Omega-v5.0.apk"

apksigner sign \
  --min-sdk-version 26 \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --ks "$KEYSTORE" \
  --ks-key-alias mikumi_key \
  --ks-pass pass:mikumi2026 \
  --key-pass pass:mikumi2026 \
  --out "$FINAL_APK" \
  "$BUILD_DIR/mikumi-aligned.apk"

echo "✅ SUCCESS! Built Android 14/15 compliant APK: $FINAL_APK"
if [ -d "/sdcard/Download" ]; then
  cp "$FINAL_APK" "/sdcard/Download/Mikumi-3D-Omega-v5.0.apk"
  echo "📲 Copied to /sdcard/Download/Mikumi-3D-Omega-v5.0.apk — tap in Files to install!"
fi
