# RecruitKR — APK kaise banayein (naye Chat features ke saath)

Saara code taiyaar + tested hai (chat + AI assistant + naye job cards).
Bas ye 3 phase aapko apne PC/accounts se karne hain. Mostly copy-paste.

> Main (Claude) aapke liye APK download link nahi bana sakta — kyunki APK aapke
> **Expo account** me banta hai aur backend aapke **Render/GitHub** account pe deploy
> hota hai. In dono ka login sirf aap kar sakte hain. Neeche sab ready hai.

---

## PHASE 1 — Code GitHub pe push karo (Render khud deploy karega)

VS Code terminal me:

```bash
cd c:\Users\Asus\Recruitkr-app
git push origin main
```

- GitHub login maange to `anaagatHR` wale credentials do.
- Render iss repo se juda hai → push hote hi **automatically deploy** ho jayega.

---

## PHASE 2 — Render pe Claude API key set karo (AI chat/features ke liye)

Render aapke local `.env` ko nahi dekhta. Key **Render pe** daalni hogi:

1. https://dashboard.render.com kholo → apni `recruitkr-api` service kholo.
2. **Environment** → **Environment Variables** → **Add**:
   - `ANTHROPIC_API_KEY`  →  *(apni Claude key)*
   - `AI_MODEL`  →  `claude-haiku-4-5-20251001`  *(optional, cost kam)*
3. **Save Changes** → Render khud redeploy karega.
4. `MONGO_URI` aur `JWT_SECRET` pehle se set hone chahiye (na hon to add karo).

> ⚠️ Claude key sirf Render pe daalna. Kabhi kisi file me (jo GitHub jaaye) ya chat me mat bhejna.

### Deploy check (5–10 min baad, browser me)
- `https://recruitkr-api.onrender.com/` → `{"status":"ok"...}` = live
- `https://recruitkr-api.onrender.com/api/ai/status` → `{"enabled":true}` = AI on ✅
  - `{"enabled":false}` aaye to key set nahi hui / redeploy pending.

*(Free Render pehli request pe 30–50s soke se jaagta hai — normal hai.)*

---

## PHASE 3 — APK banao (EAS cloud build)

Ek **free Expo account** chahiye (https://expo.dev pe banao).

```bash
cd c:\Users\Asus\Recruitkr-app\mobile

npm install -g eas-cli     # ek baar
eas login                  # apne Expo account me login
eas build -p android --profile preview
```

- Build cloud pe banega (~10–15 min). Khatam hone pe terminal me ek **download link**
  milega → APK download karke phone pe install.
- `preview` profile = direct-install APK. Play Store ke liye baad me:
  `eas build -p android --profile production` (AAB banata hai).

Agar "Create new project?" poochhe → **Yes**. (projectId already set hai.)

---

## Naye features — kahan test karein (APK install ke baad)

### 💬 Real chat (candidate ↔ company) — key ki zaroorat NAHI
- **Candidate** → kisi job ki detail kholo → apply bar ke paas **"Chat"** button →
  employer se message karo.
- **Employer** → koi job → **Applicants** → kisi applicant par **"Chat"** →
  candidate se baat.
- Dono ke liye neeche **Chat** tab = inbox (unread badge + last message).
- Naye message har 5 sec me apne aap aate hain.

### 🤖 AI Career Assistant — key CHAHIYE (Phase 2)
- **Candidate** → **Chat** tab → upar **"AI Career Assistant"** card → resume/
  interview/job help. English/Hindi/Hinglish sab chalega.
- Key na ho to ye card gracefully "unavailable" dikhata hai (crash nahi).

### 🎨 Naya look
- Job cards refresh ho gaye (salary pill, tag row, bada bookmark) — poore app me.

---

## Sanity checklist (launch se pehle)
- [ ] `/api/ai/status` → `{"enabled":true}`
- [ ] Login/register chal raha hai
- [ ] Candidate → JobDetail pe **Chat** button dikh raha hai
- [ ] Employer → Applicants pe **Chat** button dikh raha hai
- [ ] Chat tab me message bhej/aa raha hai
- [ ] AI Assistant card reply de raha hai (key set hone ke baad)
- [ ] APK phone pe install hokar chal raha hai
