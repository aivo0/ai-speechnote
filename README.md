# AI SpeechNote Web

Landing page and licensing system for AI SpeechNote - a privacy-focused AI-powered speech recognition desktop application with Estonian and English language support.

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Database**: Cloudflare D1 with Drizzle ORM
- **Auth**: BetterAuth (Google OAuth + Email/OTP)
- **Hosting**: Cloudflare Workers
- **Styling**: TailwindCSS v4
- **Package Manager**: pnpm (required)

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Cloudflare account
- Wrangler CLI (`pnpm add -g wrangler`)

## Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/aivo0/ai-speechnote
cd ai-speechnote
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize local database**

```bash
pnpm db:push
```

5. **Start development server**

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## Development Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build

# Database
pnpm db:generate  # Generate migrations
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio

# Code Quality
pnpm check        # Type checking
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier

# Testing
pnpm test         # Run all tests
pnpm test:unit    # Run unit tests
pnpm test:e2e     # Run E2E tests

# Deployment
pnpm deploy       # Deploy to Cloudflare
```

## Project Structure

```
src/
├── routes/          # SvelteKit routes
├── lib/
│   ├── server/
│   │   ├── db/      # Database schema & config
│   │   └── auth.ts  # Auth configuration
│   └── components/  # Reusable components
├── app.html         # HTML template
├── app.css          # Global styles
└── app.d.ts         # TypeScript definitions
```

## Database Management

The project uses Cloudflare D1 in production and local SQLite for development.

### Apply migrations to Cloudflare D1:

```bash
# Local D1 database
pnpm wrangler d1 migrations apply ai-speechnote-db --local

# Production D1 database
pnpm wrangler d1 migrations apply ai-speechnote-db --remote
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=file:./local.db
BETTER_AUTH_SECRET=<32-character-random-string>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=
PUBLIC_BASE_URL=https://speechnote.ai
```

## Deployment

1. **Set Cloudflare secrets**

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET
pnpm wrangler secret put GOOGLE_CLIENT_ID
# ... add other secrets
```

2. **Apply database migrations**

```bash
pnpm wrangler d1 migrations apply ai-speechnote-db --remote
```

3. **Deploy to Cloudflare Workers**

```bash
pnpm deploy
```

## Important Notes

- **Package Manager**: This project uses pnpm exclusively. Do not use npm or yarn.
- **Node Version**: Ensure you're using Node.js 18 or higher
- **Database**: Migrations must be applied to both local and remote D1 databases
- **Auth Routes**: BetterAuth handles `/api/auth/*` routes automatically

## License

MIT
