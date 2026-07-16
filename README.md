# aashishpandey-FE

Frontend for [aashishpandey.com](https://aashishpandey.com), deployed on Vercel.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- [Framer Motion](https://motion.dev) for UI transitions and micro-interactions
- [GSAP](https://gsap.com) (+ ScrollTrigger) for scroll-driven animation
- [React Three Fiber](https://r3f.docs.pmnd.rs) + drei for the hero's 3D centerpiece

## Structure

- `src/components/Hero.tsx` — headline, GSAP intro timeline, 3D blob (right side, desktop only)
- `src/components/three/HeroScene.tsx` — the R3F canvas, lazy-loaded client-only
- `src/components/Cursor.tsx` — custom cursor, disabled on touch devices
- `src/components/Work.tsx` — fetches projects from the backend, falls back to
  placeholder data if the API is unreachable or empty
- `src/components/Contact.tsx` — posts to the backend's `/api/contact` route

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to wherever [aashishpandey-be](https://github.com/aashisharyan2595/aashishpandey-be)
is running (defaults to `http://localhost:4000`).

## Deploying to Vercel

Set `NEXT_PUBLIC_API_URL` to the deployed backend URL as a Vercel environment
variable.
