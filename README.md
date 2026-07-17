# aashishpandey-FE

Frontend for [aashishpandey.com](https://aashishpandey.com), deployed on Vercel.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- [Framer Motion](https://motion.dev) for UI transitions and micro-interactions
- [GSAP](https://gsap.com) (+ ScrollTrigger) for scroll-driven animation
- [React Three Fiber](https://r3f.docs.pmnd.rs) + drei for the hero's 3D
  centerpiece — deliberately the only 3D element on the site

## Structure

- `src/components/Hero.tsx` — headline, GSAP intro timeline, 3D blob (right side, desktop only)
- `src/components/three/HeroScene.tsx` — the R3F canvas, lazy-loaded client-only
- `src/components/Cursor.tsx` — custom cursor, disabled on touch devices
- `src/components/Work.tsx` — work preview on the homepage
- `src/lib/case-studies.ts` — the 4 case studies backing `/work` and
  `/work/[slug]`; static data, not CMS-driven (deliberate scope decision —
  only the blog got a CMS)
- `src/components/Contact.tsx` — posts to the backend's `/api/contact` route,
  with client-side email format validation before submitting
- `src/app/blog`, `src/app/blog/[slug]`, `src/app/blog/category/[slug]`,
  `src/app/blog/tag/[tag]` — reads from the backend `/api/blog` and
  `/api/categories`, empty-state if none

## Admin CMS (`/admin`)

Password-free, DB-backed auth (JWT bearer token in `localStorage`, no
cookies) — see [aashishpandey-be](https://github.com/aashisharyan2595/aashishpandey-be)'s
README for the backend side of this.

- `/admin/login` — bootstrap (first-run setup), local password login, Google
  sign-in, forgot/reset password
- `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]` — drag-and-drop
  block editor (heading/paragraph/image/quote/code blocks), 3 starter
  templates, autosave, revision history, per-post SEO fields
- `/admin/media` — Cloudinary-backed media library
- `/admin/categories` — flat category list used by the blog
- `/admin/users` — approve/reject/remove admin accounts
- `/admin/submissions` — read-only contact form entries

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to wherever [aashishpandey-be](https://github.com/aashisharyan2595/aashishpandey-be)
is running (defaults to `http://localhost:4000`). Note the backend's local
CORS (`CLIENT_ORIGIN`) is tied to a specific port, so keep the frontend dev
server on the port the backend expects unless you update both.

## Deploying to Vercel

- Framework preset must be **Next.js** (misconfiguring it as "Other" breaks
  the "find output directory" step even though the build itself succeeds)
- Set `NEXT_PUBLIC_API_URL` to the deployed backend URL, scoped per
  environment (Production vs. Preview/`staging` branch)
- `main` → production (`aashishpandey.com`), `staging` branch → Preview
  environment (`staging.aashishpandey.com`)
