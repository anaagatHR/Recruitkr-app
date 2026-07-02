# RecruitKR — Deploy backend + build APK (step by step)

Sab kuch tayyar hai. Sirf ye 3 phase aapko karne hain (mostly copy-paste).

---

## PHASE 1 — Backend deploy karo (Render)

### 1a. Code GitHub pe push karo
AI code local commit ho chuka hai. Bas push karna baaki hai (VS Code terminal me):

```bash
cd c:\Users\Asus\RecruitKR\backend
git push origin main
```
- GitHub login maange to `anaagatHR` wale credentials do.
- Render iss repo se juda hua hai → push hote hi **automatically deploy** shuru kar dega.

### 1b. Render dashboard me API key + settings daalo
Render aapke local `.env` ko nahi dekh sakta (wo sirf aapke PC pe hai). Isliye key **Render pe** daalni hogi:

1. https://dashboard.render.com kholo → apni `recruitkr-api` service kholo.
2. Left me **Environment** → **Environment Variables** → **Add Environment Variable**:
   - Key: `ANTHROPIC_API_KEY`  →  Value: *(apni Claude key paste karo)*
   - Key: `AI_MODEL`  →  Value: `claude-haiku-4-5-20251001`  *(optional, cost kam)*
3. **Save Changes** → Render khud redeploy karega.
4. `MONGO_URI` aur `JWT_SECRET` pehle se set hone chahiye (pehle deploy me the). Na hon to same jagah add karo.

> ⚠️ Claude key sirf Render Environment me daalna. Kabhi kisi file me jo GitHub pe jaaye, ya chat me mat bhejna.

### 1c. Deploy check karo (5-10 min baad)
Browser me kholo:
- `https://recruitkr-api.onrender.com/`  → `{"name":"RecruitKR API","status":"ok"...}` dikhe = live
- `https://recruitkr-api.onrender.com/api/ai/status` → `{"enabled":true}` dikhe = AI on ✅
  - Agar `{"enabled":false}` aaye → key set nahi hui / redeploy pending.

*(Free Render pehli request pe 30-50s soke se jaagta hai — normal hai.)*

---

## PHASE 2 — App backend se juda hai (already done)
`mobile/app.json` me `extra.apiUrl` already `https://recruitkr-api.onrender.com/api` set hai.
Backend live hote hi APP + AI dono kaam karenge. Kuch badalna nahi.

---

## PHASE 3 — APK banao (EAS cloud build)

APK banane ke liye ek **free Expo account** chahiye (https://expo.dev pe banao).

VS Code terminal me:

```bash
cd c:\Users\Asus\RecruitKR\mobile

# 1) EAS CLI (ek baar)
npm install -g eas-cli

# 2) Expo account me login
eas login

# 3) APK build (cloud pe banega, ~10-15 min)
eas build -p android --profile preview
```

- Build khatam hone pe terminal me ek **download link** milega → APK download karke phone pe install.
- Ye `preview` profile APK banata hai (direct install ke liye). Play Store ke liye baad me:
  `eas build -p android --profile production` (AAB banata hai).

### Agar EAS pehli baar project link maange
- "Create new project?" → **Yes** (Enter).
- Wo `app.json` me `projectId` daal dega (ek already set hai: `e7cdd70e-...`).

---

## Quick sanity checklist (launch se pehle)
- [ ] `https://recruitkr-api.onrender.com/api/ai/status` → `{"enabled":true}`
- [ ] App me login/register chal raha hai
- [ ] Job detail pe "AI Match %" dikh raha hai
- [ ] Employer me "✨ Generate with AI" description bana raha hai
- [ ] APK phone pe install hokar chal raha hai

---

## AI features summary (kya bana)
| Feature | Kahan | Kya karta hai |
|---|---|---|
| AI Match score | Job detail | Candidate ka fit % + reason + skill breakdown |
| AI Recommended | Home screen | Best-fit jobs with match % |
| Generate with AI | Post Job (employer) | Title se poori JD + requirements + skills |
| Rank by AI fit | Applicants (employer) | Applicants ko best-fit order me |
| Resume auto-fill | Edit Profile | Resume text se profile khud bharna |

Bina key ke bhi app chalti hai (AI buttons chhup jaate hain). Key daalte hi sab live.
