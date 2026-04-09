# Frontend (Next.js) — AI Music Generator

This is the Next.js web app for the AI music generator.

It includes:

- Next.js App Router (`src/app`) with `(auth)` + `(main)` route groups
- Better Auth (email/password) + Polar integration for credits
- Prisma (Postgres) for users/songs/likes/categories
- Inngest for background generation jobs (calls Modal endpoints)
- S3 presigned URLs for playback + thumbnails
- Tailwind v4 + daisyUI (all themes enabled) + theme switcher

## Prereqs

- Node.js (recommended: Node 20+)
- A Postgres database (local Docker or hosted like Neon)
- A deployed Modal backend (see `../backend/README.md`) and its endpoint URLs
- AWS credentials with permission to read objects from your S3 bucket (used server-side to presign URLs)

## Environment variables

Env var validation is defined in `src/env.js`.

Create `frontend/.env` with:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/musicgen"

# Better Auth
BETTER_AUTH_SECRET="replace-me"
BETTER_AUTH_URL="http://localhost:3000"

# Modal proxy auth (required to call the backend endpoints)
MODAL_KEY="replace-me"
MODAL_SECRET="replace-me"

# S3 (used server-side to generate presigned GET URLs)
AWS_ACCESS_KEY_ID="replace-me"
AWS_SECRET_ACCESS_KEY="replace-me"
AWS_REGION="ap-south-1"
S3_BUCKET_NAME="your-bucket-name"

# Modal endpoint URLs (copy from Modal after deploy)
GENERATE_FROM_DESCRIPTION="https://..."
GENERATE_FROM_DESCRIBED_LYRICS="https://..."
GENERATE_WITH_LYRICS="https://..."

# Polar (credits)
POLAR_ACCESS_TOKEN="replace-me"
POLAR_WEBHOOK_SECRET="replace-me"
```

Notes:

- If you need to boot the app without full env setup (e.g. in Docker builds), you can set `SKIP_ENV_VALIDATION=1`.
- Keep all secrets server-side. This project’s env schema does not expose any client vars.

## Local database (optional)

If you want a local Postgres via Docker/Podman:

1. Ensure `DATABASE_URL` is set in `frontend/.env`
2. Run the helper script:
	- macOS/Linux: `./start-database.sh`
	- Windows: run it via WSL (instructions are at the top of `start-database.sh`)

## Install + run

From `frontend/`:

1. Install dependencies:

```bash
npm install
```

2. Apply schema to your DB (pick one):

```bash
# Recommended for local dev
npm run db:push

# Or run migrations
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

## How generation works

High-level code path:

1. A server action creates `Song` rows and emits an event:
	- `src/actions/generation.ts`
2. Inngest receives `generate-song-event` and calls Modal:
	- `src/inngest/functions.ts`
3. The Modal backend uploads to S3 and returns `{ s3_key, cover_image_s3_key, categories }`.
4. Inngest updates Prisma models (`Song`, `Category`) accordingly.
5. Playback/thumbnail URLs are created server-side using S3 presigned GET URLs:
	- `src/actions/generation.ts` (`getPresignedUrl`, `getPlayUrl`)

## Auth + credits (Polar)

Auth is configured in `src/lib/auth.ts` using Better Auth + Prisma adapter.

Polar integration:

- `src/lib/auth.ts` uses Polar **sandbox** (`server: "sandbox"`).
- Product IDs and credit increments are currently hard-coded in `src/lib/auth.ts`.

Local webhook testing:

- Expose your local server: `npm run polar-webhooks` (uses `ngrok http 3000`)
- Configure Polar to send webhooks to the ngrok URL.

## Theming

- Tailwind v4 is configured in CSS-first mode.
- daisyUI is enabled with **all themes**.
- Themes are applied via the `data-theme` attribute (daisyUI standard) using `next-themes`.

Key files:

- `src/styles/globals.css` (daisyUI plugin + token bridging)
- `src/components/sidebar/theme-switcher.tsx` (theme dropdown)
- `src/lib/daisyui-themes.ts` (theme list)

## Troubleshooting

### Prisma / Postgres connection errors

- Verify `DATABASE_URL` is correct.
- If using hosted Postgres (e.g. Neon) and you see DNS/network issues locally, try switching networks or using the provider’s pooler/region guidance.

### Modal endpoint errors (401 / proxy auth)

- Ensure `MODAL_KEY` and `MODAL_SECRET` are set.
- Confirm your endpoint URLs match the deployed functions.

### S3 thumbnails with `next/image`

- `next.config.js` restricts remote images. Ensure the S3 hostname matches your bucket region/URL.
- If the optimizer ever fails for long presigned URLs, you can set `unoptimized` on the `next/image` usage for that image.
