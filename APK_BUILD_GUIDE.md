# RecruitKR — APK kaise banaye (Step by Step)

APK = woh installable file jo aap phone me daal sakte ho ya kisi ko WhatsApp/email
se bhej sakte ho. Niche **easiest tareeka (EAS cloud build)** diya hai — isme aapke
PC par Android Studio / Java install karne ki zaroorat NAHI hai.

---

## ⚠️ Pehle ek zaroori baat — Backend deploy karna

APK ek **real phone** par chalega. Phone aapke PC ke `localhost` ko nahi dekh sakta.
Isliye APK banane se pehle backend ko **internet par deploy** karna zaroori hai
(taki app ko ek public URL mile). 2 free options:

- **Render.com** (recommended, free): backend folder push karo, ye URL de dega
  jaise `https://recruitkr-api.onrender.com`
- **Railway.app** ya **Cyclic.sh** — same kaam

Aur ek free **MongoDB Atlas** database (https://mongodb.com/atlas) ka URI us server
ke `MONGO_URI` me daalna hai.

> Deploy karne me help chahiye? Mujhe bolo — main step-by-step kara dunga.

Backend deploy hone ke baad, uska URL yahan daalo:
`mobile/app.json` → `"extra": { "apiUrl": "https://YOUR-BACKEND-URL/api" }`

(Bina deploy kiye bhi APK ban jayega, par tab app data load nahi karega kyunki
backend nahi milega.)

---

## 📦 EAS se APK banana (cloud, easiest)

### 1. Free Expo account banao
https://expo.dev par sign up karo (free).

### 2. EAS CLI install karo
```bash
npm install -g eas-cli
```

### 3. Login karo
```bash
cd RecruitKR/mobile
eas login
```
(Apna Expo email/password daalo.)

### 4. Project ko EAS se link karo (pehli baar)
```bash
eas build:configure
```
(Android select karo — `eas.json` already bana hua hai, bas Enter dabate jao.)

### 5. APK build karo
```bash
eas build -p android --profile preview
```
- Cloud par build hoga (5-15 min).
- Khatam hone par ek **download link** milega — usse APK download karo.
- Wahi APK phone me install karo (phone settings me "Install from unknown
  sources" / "Unknown apps" allow karna pad sakta hai).

Bas! Aapka RecruitKR APK ready. 🎉

---

## 📲 Bina APK ke — Expo Go se test (sabse fast)

Agar abhi sirf phone par dekhna hai (APK ki zaroorat nahi):
1. Phone me Play Store se **Expo Go** install karo.
2. PC par: `cd mobile` → `npm start`
3. Phone aur PC same Wi-Fi par rakho, QR code scan karo.
4. (Phone par data ke liye `mobile/src/api/client.js` me apne PC ka LAN IP daalo —
   `ipconfig` se IPv4 dekho.)

---

## 🏗️ Local APK build (advanced, optional)

Agar cloud nahi chahiye to local bhi ban sakta hai, par ye chahiye:
- Android Studio + Android SDK
- Java JDK 17

Phir:
```bash
cd mobile
npx expo prebuild -p android
cd android
./gradlew assembleRelease
# APK yahan milega: android/app/build/outputs/apk/release/app-release.apk
```

---

## Summary

| Tareeka            | PC par kya chahiye         | Result            |
|--------------------|----------------------------|-------------------|
| **EAS (cloud)**    | Sirf Expo account          | APK download link |
| Expo Go (test)     | Kuch nahi                  | Phone par preview |
| Local build        | Android Studio + Java      | APK file locally  |

Sabse aasaan = **EAS cloud build**.
