# EnglishAI — Full-Stack English Learning Platform

AI-powered English learning with authentication, subscriptions, leaderboard and unlimited AI-generated exercises.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Database + Auth**: Supabase (PostgreSQL + Row Level Security)
- **Payments**: LemonSqueezy (works with Ukrainian bank cards)
- **AI**: Anthropic Claude (generates exercises on demand)
- **Deployment**: Vercel

---

## 🚀 Quick Deploy (15 minutes)

### 1. Clone & install
```bash
git clone https://github.com/YOUR/englishai
cd englishai
npm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) → New Project
2. SQL Editor → paste entire contents of `supabase/schema.sql` → Run
3. Authentication → Providers → enable **Google** (optional)
4. Copy your Project URL and anon key

### 3. Set up LemonSqueezy (payments)
1. Register at [lemonsqueezy.com](https://lemonsqueezy.com) — works for Ukrainians ✅
2. Create a Store → Create a Product → Subscription → $10/month
3. Note your Store ID, Product ID, Variant ID
4. Settings → Webhooks → add your URL: `https://your-domain.vercel.app/api/webhooks/lemonsqueezy`
5. Subscribe to: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`

### 4. Get Anthropic API key
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key

### 5. Configure environment variables
```bash
cp .env.example .env.local
# Fill in all values
```

### 6. Deploy to Vercel
```bash
npx vercel --prod
```

Add all environment variables in Vercel dashboard → Settings → Environment Variables.

---

## 📁 Project Structure

```
englishai/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   ├── page.tsx                # Login / Signup
│   │   └── callback/route.ts       # OAuth callback
│   ├── dashboard/page.tsx          # Main app with units
│   ├── learn/[unitId]/page.tsx     # Exercise session
│   ├── leaderboard/page.tsx        # Global rankings
│   ├── pricing/page.tsx            # Pricing + checkout
│   └── api/
│       └── webhooks/
│           └── lemonsqueezy/       # Subscription webhooks
├── lib/
│   └── supabase.ts                 # DB client + types
├── middleware.ts                   # Auth route protection
└── supabase/
    └── schema.sql                  # Complete DB schema
```

---

## 💳 Payment Flow (LemonSqueezy)

1. User clicks "Upgrade" on `/pricing`
2. Redirected to LemonSqueezy checkout with `user_id` in custom data
3. After payment, LemonSqueezy calls webhook `/api/webhooks/lemonsqueezy`
4. Webhook updates `profiles.is_premium = true` in Supabase
5. User now has unlimited access

**Why LemonSqueezy for Ukrainians:**
- Accepts Ukrainian cards (Monobank, PrivatBank, VISA/MC)
- Works as Merchant of Record (handles VAT/taxes globally)
- No need for a US company
- Instant setup, no KYB required for small volumes

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User data, subscription status, XP, streaks |
| `categories` | Unit categories (Tenses, Grammar, IT English...) |
| `units` | Individual learning units |
| `user_progress` | Every completed exercise session |
| `daily_usage` | Tracks free tier daily limits |
| `leaderboard` | View — auto-calculated rankings |

---

## 🔒 Free vs Premium

| Feature | Free | Premium ($10/mo) |
|---------|------|-----------------|
| Units/day | 3 | Unlimited |
| Tenses | ✅ | ✅ |
| Grammar | ✅ | ✅ |
| Vocabulary | ✅ | ✅ |
| Travel | ✅ | ✅ |
| IT English | ❌ | ✅ |
| Business | ❌ | ✅ |
| IELTS/TOEFL | ❌ | ✅ |
| Medical | ❌ | ✅ |
| Advanced (B2-C1) | ❌ | ✅ |

---

## 📈 Scaling to Millions of Exercises

The AI generates unique exercises on every visit — there's no fixed pool.
Each unit can produce infinite variations because Claude generates them fresh each time.

For scale:
- Add Redis caching for generated exercises (e.g., Upstash Redis on Vercel)
- Cache exercises per unit for 1 hour to reduce API costs
- Add exercise difficulty progression based on user score history

---

## 🛠️ Local Development

```bash
npm run dev
# → http://localhost:3000
```

Make sure your `.env.local` has all variables set.
