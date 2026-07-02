# RecruitKR — Mobile App + Backend

Professional recruitment app for **RecruitKR** (https://www.recruitkr.com).
Candidates job dhundh sakte hain aur apply kar sakte hain; employers job post kar
sakte hain aur applicants manage kar sakte hain.

```
RecruitKR/
├── backend/    → Node.js + Express + MongoDB API
└── mobile/     → React Native (Expo) Android app
```

---

## Features

**Candidate (Job Seeker)**
- Sign up / Login (role: Job Seeker)
- Jobs browse, search, aur category filter (IT, Healthcare, Banking, etc.)
- Job ki full detail dekhna + **one-tap Apply**
- "My Applications" — apply ki hui jobs ka status track (Applied / Shortlisted / Hired / Rejected)
- Profile + skills + experience edit karna

**Employer (Company)**
- Sign up / Login (role: Employer)
- New job post karna (type, category, salary, requirements, skills)
- Apne posted jobs + applicant count dekhna
- Har job ke **applicants dekhna** aur status update karna (Shortlist / Hire / Reject)
- Company profile manage karna

---

## Zaroori cheezein (Prerequisites)

1. **Node.js** (already installed ✅)
2. **MongoDB** — do options:
   - **Recommended: MongoDB Atlas (free cloud)** — kuch install nahi karna padta.
     https://www.mongodb.com/atlas par free account banao, ek cluster banao,
     "Connect" → "Drivers" se connection string copy karo.
   - Ya local MongoDB install karke chalao.
3. App phone par chalane ke liye: phone me **Expo Go** app (Play Store se) ya
   ek **Android emulator**.

---

## Step 1 — Backend chalao

```bash
cd backend
npm install            # already done

# .env file me apna MongoDB URI daalo:
# .env.example ko .env me copy karo (already ek .env bana hua hai)
# MONGO_URI me Atlas wala string paste karo, e.g.
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/recruitkr

npm run seed           # demo jobs + demo logins database me daalega
npm start              # API start hogi: http://localhost:5000
```

Browser me `http://localhost:5000` kholo — `{"name":"RecruitKR API","status":"ok"}` dikhega = sab theek.

**Demo logins (seed ke baad):**
| Role      | Email                     | Password     |
|-----------|---------------------------|--------------|
| Candidate | candidate@recruitkr.com   | password123  |
| Employer  | employer@recruitkr.com    | password123  |

---

## Step 2 — App ko backend se connect karo

File kholo: `mobile/src/api/client.js` aur `API_BASE_URL` set karo:

- **Android emulator** par chala rahe ho → `http://10.0.2.2:5000/api` (default, kuch mat badlo)
- **Real phone (Expo Go)** par → apne PC ka LAN IP daalo:
  - Windows me `ipconfig` chalao → "IPv4 Address" dekho (e.g. `192.168.1.5`)
  - `API_BASE_URL = "http://192.168.1.5:5000/api"`
  - (Phone aur PC same Wi-Fi par hone chahiye.)

---

## Step 3 — App chalao

```bash
cd mobile
npm install            # already done
npm start              # Expo dev server start hoga, ek QR code dikhega
```

- **Phone par:** Expo Go app kholo → QR code scan karo.
- **Emulator par:** terminal me `a` dabao (Android emulator pehle se chalu hona chahiye).

App khulne ke baad demo login se andar jao, ya naya account banao.

---

## APK (installable file) kaise banaye

Play Store / sideload ke liye real APK banane ke liye Expo ka cloud build (EAS) use hota hai:

```bash
cd mobile
npm install -g eas-cli
eas login              # free Expo account chahiye
eas build -p android --profile preview   # APK link milega download ke liye
```

(EAS pehli baar config ke liye `eas.json` bana dega — bas Enter dabate raho.)

---

## Backend API endpoints (reference)

| Method | Endpoint                        | Kaam                                  |
|--------|---------------------------------|---------------------------------------|
| POST   | `/api/auth/register`            | Naya account                          |
| POST   | `/api/auth/login`               | Login                                  |
| GET    | `/api/auth/me`                  | Apni profile                          |
| PUT    | `/api/auth/me`                  | Profile update                        |
| GET    | `/api/jobs`                     | Jobs list (search/category filter)    |
| GET    | `/api/jobs/:id`                 | Ek job ki detail                      |
| POST   | `/api/jobs`                     | Job post (employer)                   |
| DELETE | `/api/jobs/:id`                 | Job delete (employer)                 |
| GET    | `/api/jobs/mine/list`           | Employer ki jobs + applicant count    |
| POST   | `/api/applications`             | Job par apply (candidate)             |
| GET    | `/api/applications/mine`        | Candidate ki applications             |
| GET    | `/api/applications/job/:jobId`  | Job ke applicants (employer)          |
| PUT    | `/api/applications/:id/status`  | Applicant status (employer)           |

---

## Tech Stack

- **App:** React Native (Expo SDK 51), React Navigation
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT (token-based), bcrypt password hashing

---

## Aage kya add kar sakte hain (future)

- Resume / document upload (file storage)
- Push notifications (naya applicant / status change)
- Hindi language toggle (website jaisa bilingual)
- Saved / bookmarked jobs
- In-app chat (candidate ↔ recruiter)
```
