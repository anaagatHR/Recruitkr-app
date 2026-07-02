# RecruitKR — APK banane ke Steps (Easy)

APK = phone me install hone wali file, jise aap kisi ko bhi bhej sakte ho.
Niche **easiest tareeka** hai — PC par Android Studio/Java ki zarurat NAHI.

---

## ⚡ Sabse aasaan: BUILD-APK.bat double-click karo

1. `C:\Users\Asus\RecruitKR\` folder kholo
2. **`BUILD-APK.bat`** par double-click karo
3. Jo bole woh karo (login + build) — ho jayega!

Niche manual steps bhi diye hain agar .bat na chale to.

---

## 📝 Manual Steps

### Step 1 — Free Expo account banao
- https://expo.dev par jao → Sign Up (free)
- Email + password yaad rakho.

### Step 2 — Terminal kholo
- `C:\Users\Asus\RecruitKR\mobile` folder me terminal kholo
  (folder me Shift + Right-click → "Open in Terminal" / "PowerShell")

### Step 3 — Login karo
```
npx eas-cli login
```
(Apna Expo email/password daalo.)

### Step 4 — APK build karo
```
npx eas-cli build -p android --profile preview
```
- Pehli baar "create project?" / "generate keystore?" pooche to **Yes / Enter** dabao.
- Cloud par build hoga (10-15 min).
- Khatam hone par ek **download link** terminal me aayega.

### Step 5 — APK install karo
- Link kholo → APK download karo (phone me ya PC me).
- Phone me APK kholo → install karo.
  (Pehli baar "Unknown sources / Unknown apps allow karo" maange to Allow karo.)

**Ho gaya! Aapki RecruitKR app phone me install! 🎉**

---

## ⚠️ ZAROORI: Data ke liye backend

Yeh APK **kisi bhi phone** par chalega, par jobs/login tabhi chalenge jab
**backend internet par live ho** (kyunki phone aapke laptop ko nahi dekh sakta).

- Abhi backend sirf laptop par hai → APK me jobs/login **load nahi honge**.
- Solution: backend ko free Render.com par deploy karo, uska URL
  `mobile/app.json` ke `"apiUrl"` me daalo, phir APK banao.

> Backend deploy karne me help chahiye? Mujhe bolo — main step-by-step kara dunga.
> (Tab APK poori tarah, real data ke saath chalega.)

**Test ke liye (bina deploy):** APK install karke design/screens dekh sakte ho,
bas login/jobs khaali rahenge.

---

## Build profiles (reference)

| Command | Banata hai | Kiske liye |
|---|---|---|
| `eas build -p android --profile preview` | **APK** | Khud test / logon ko bhejne ke liye |
| `eas build -p android --profile production` | **AAB** | Play Store ke liye |

Abhi aap **preview (APK)** wala use karo.
