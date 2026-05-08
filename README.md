# 💻 Frontend (Next.js) — AI Music Generator

This is the Next.js App Router web app. It handles authentication, credit billing, database state, background orchestration, and secure playback.

## 🛠 Tech stack

- Next.js (App Router) + React 19 + TypeScript (Node 20+)
- Prisma (Postgres) for users/songs/likes/categories
- Better Auth (email/password) + Polar integration for credits
- Inngest for background generation jobs (calls Modal endpoints)
- AWS S3 presigned URLs for playback + thumbnails
- Tailwind CSS v4 + daisyUI + Radix UI primitives
- Zustand (player state), React Hook Form, Zod

## 📁 Key paths (no-code-reading guide)

| Path | What it does | Inputs → Outputs |
| --- | --- | --- |
| `src/actions/generation.ts` | Server actions that create `Song` rows, emit Inngest events, and generate S3 presigned URLs for playback. | Form data → DB writes / presigned URLs |
| `src/actions/songs.ts` | Server actions for song management (rename/delete/publish/likes, etc.). | User actions → DB writes |
| `src/inngest/functions.ts` | Background worker that calls Modal, updates `Song` rows, connects categories, and deducts credits on success. | Event → Modal call → DB updates |
| `src/app/api/inngest/route.ts` | Exposes Inngest functions to the Inngest dev server/cloud via HTTP. | HTTP → function execution |
| `src/lib/auth.ts` | Better Auth configuration + Polar plugins; Polar webhooks top up user credits. | Sign-in / webhook → session / credits |
| `prisma/schema.prisma` | Prisma schema: `User`, `Song`, `Like`, `Category` + Better Auth tables. | Prisma → Postgres |
| `src/server/db.ts` | Prisma client singleton for server/runtime. | n/a |
| `src/env.js` | Zod-based env validation (server-only). | `process.env` → validated `env` |

## 🔐 Environment variables

Env validation is defined in `src/env.js`. Create `frontend/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string |
| `NODE_ENV` | ⚪️ | Runtime environment (`development`/`test`/`production`); defaults to `development` |
| `BETTER_AUTH_SECRET` | ✅ | Better Auth signing/crypto secret |
| `BETTER_AUTH_URL` | ⚪️ | Optional Better Auth base URL (set if you see “Base URL could not be determined”, e.g. `http://localhost:3000`) |
| `MODAL_KEY` | ✅ | Modal proxy auth header value |
| `MODAL_SECRET` | ✅ | Modal proxy auth header value |
| `AWS_ACCESS_KEY_ID` | ✅ | S3 credentials (server-side presigning) |
| `AWS_SECRET_ACCESS_KEY` | ✅ | S3 credentials (server-side presigning) |
| `AWS_REGION` | ✅ | S3 region |
| `S3_BUCKET_NAME` | ✅ | S3 bucket name used when presigning |
| `GENERATE_FROM_DESCRIPTION` | ✅ | Modal endpoint URL for description-only generation |
| `GENERATE_FROM_DESCRIBED_LYRICS` | ✅ | Modal endpoint URL for described-lyrics generation |
| `GENERATE_WITH_LYRICS` | ✅ | Modal endpoint URL for custom-lyrics generation |
| `POLAR_ACCESS_TOKEN` | ✅ | Polar API token (Polar sandbox is used in code) |
| `POLAR_WEBHOOK_SECRET` | ✅ | Polar webhook secret for verifying callbacks |
| `SKIP_ENV_VALIDATION` | ⚪️ | Set to `1` to bypass env validation (build/dev) |

Notes:

- This repo does not expose any `NEXT_PUBLIC_*` variables; keep secrets server-side.
- Empty strings are treated as undefined (`emptyStringAsUndefined=true`).

## Local database (optional)

If you want a local Postgres via Docker/Podman:

1. Ensure `DATABASE_URL` is set in `frontend/.env`
2. Run the helper script:
  - macOS/Linux: `./start-database.sh`
  - Windows: run it via WSL (instructions are at the top of `start-database.sh`)

## 🚀 Install + run

From `frontend/`:

1. Install dependencies:

```bash
npm install
```

2. Apply schema to your DB (pick one):

```bash
# Recommended for local dev
npm run db:push

# Or run migrations (dev)
npm run db:generate
```

3. Start Next.js:

```bash
npm run dev
```

4. Start Inngest dev server (separate terminal):

```bash
npm run inngest
```

## 🔄 How generation works

High-level code path:

1. A server action creates **two** `Song` rows (two `inferStep` variants) and emits an event:
  - `src/actions/generation.ts` (`generateSong` → `queueSong`)
2. Inngest receives `generate-song-event`, checks credits, calls Modal, and persists results:
  - `src/inngest/functions.ts`
3. The Modal backend uploads to S3 and returns `{ s3_key, cover_image_s3_key, categories }`.
4. Playback/thumbnail URLs are generated server-side using S3 presigned GET URLs:
  - `src/actions/generation.ts` (`getPresignedUrl`, `getPlayUrl`)

## 💳 Auth + credits (Polar)

Auth is configured in `src/lib/auth.ts` using Better Auth + Prisma adapter.

Polar integration notes:

- `src/lib/auth.ts` uses Polar **sandbox** (`server: "sandbox"`).
- Product IDs and credit increments are currently hard-coded in `src/lib/auth.ts` (small=10, medium=25, large=50).
- `src/inngest/functions.ts` decrements credits by **1** only after a successful generation.

Local webhook testing:

- Expose your local server: `npm run polar-webhooks` (runs `ngrok http 3000`)
- Configure Polar to send webhooks to the ngrok URL.

## 🎨 Theming

- Tailwind v4 is configured in CSS-first mode.
- daisyUI is enabled and themes are applied via the `data-theme` attribute using `next-themes`.

Key files:

- `src/styles/globals.css`
- `src/components/sidebar/theme-switcher.tsx`
- `src/lib/daisyui-themes.ts`

## 🧩 Troubleshooting

### Prisma / Postgres connection errors

- Verify `DATABASE_URL` is correct.
- If using hosted Postgres (e.g. Neon) and you see DNS/network issues locally, try switching networks or using the provider’s pooler/region guidance.

### Modal endpoint errors (401 / proxy auth)

- Ensure `MODAL_KEY` and `MODAL_SECRET` are set.
- Confirm your endpoint URLs match the deployed functions.

### S3 thumbnails with `next/image`

- `next.config.js` restricts remote images. Ensure the S3 hostname matches your bucket region/URL.
- If the optimizer fails for long presigned URLs, you can set `unoptimized` on that `next/image` usage.
