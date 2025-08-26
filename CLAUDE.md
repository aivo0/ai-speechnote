# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT RULES

1. **Package Manager**: ALWAYS use `pnpm` for all package management commands. NEVER use `npm`, `yarn`, or any other package manager.
   - Install packages: `pnpm add <package>`
   - Install dev dependencies: `pnpm add -D <package>`
   - Run scripts: `pnpm <script>` or `pnpm run <script>`
   - Install all dependencies: `pnpm install`

2. **Command Examples**: When providing command examples or documentation, always use `pnpm` instead of `npm` or `yarn`.

## Project Overview

AI SpeechNote Web is the landing page, authentication, and payment system for the AI SpeechNote desktop application (located in ../desktop-asr). Built with SvelteKit, it provides user registration, licensing, downloads, and documentation. Deployed to Cloudflare Workers with D1 database.

## Essential Development Commands

### Development

```bash
pnpm dev          # Start development server (http://localhost:5173)
pnpm preview      # Build and preview with Cloudflare Workers
```

### Code Quality

```bash
pnpm check        # Run type checking
pnpm lint         # Check formatting and ESLint
pnpm format       # Format code with Prettier
```

### Testing

```bash
pnpm test:unit    # Run Vitest unit tests
pnpm test:e2e     # Run Playwright e2e tests
pnpm test         # Run all tests
```

### Database Management

```bash
pnpm db:push      # Push schema changes to local database
pnpm db:generate  # Generate database migrations
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Drizzle Studio GUI

# Apply migrations to Cloudflare D1
npx wrangler d1 migrations apply speechnote-db --local
npx wrangler d1 migrations apply speechnote-db --remote
```

### Deployment

```bash
pnpm build        # Build for production
pnpm deploy       # Build and deploy to Cloudflare
npx wrangler types # Generate Cloudflare types
```

## Architecture Overview

### Technology Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: BetterAuth with Google OAuth & Email/OTP
- **Payments**: Stripe (to be integrated)
- **Deployment**: Cloudflare Workers/Pages
- **Storage**: Cloudflare R2 for app downloads
- **i18n**: Inlang Paraglide (English + Estonian)

### Project Structure

- `/src/routes/` - File-based routing (SvelteKit convention)
- `/src/lib/server/db/` - Database schema and configuration
- `/src/lib/server/auth.ts` - BetterAuth configuration
- `/src/lib/paraglide/` - Generated i18n files (do not edit directly)
- `/messages/` - i18n message files (en.json, et.json)
- `/e2e/` - Playwright end-to-end tests

### Database Architecture

The database uses Drizzle ORM with SQLite/D1 and includes:

**Authentication Tables** (BetterAuth):

- `user` - User accounts with email verification
- `session` - Active user sessions
- `account` - OAuth provider accounts
- `verification` - Email verification tokens

**Application Tables**:

- `subscription` - User subscription plans
- `purchase` - One-time purchases and license keys
- `downloadToken` - Secure download tokens with expiry
- `waitlist` - Email waitlist signups
- `appVersion` - Application versions and download URLs
- `supportTicket` - Customer support tickets
- `auditLog` - Security and activity logging

### Authentication Flow

1. **Registration**: Email/password or Google OAuth
2. **Email Verification**: Required for email signups
3. **Session Management**: Cookie-based with 7-day expiry
4. **Protected Routes**: Check `locals.user` in +page.server.ts

### Key Patterns

1. **Dual Database Support**: Development uses local SQLite, production uses Cloudflare D1
2. **Server Hooks**: Authentication and database setup in `hooks.server.ts`
3. **Type Safety**: Comprehensive TypeScript types in `app.d.ts`
4. **Component Testing**: Vitest in browser mode with Playwright provider

### Environment Configuration

Required environment variables (in `.env` for local, Wrangler secrets for production):

```env
DATABASE_URL=file:./local.db
BETTER_AUTH_SECRET=<32-char-random-string>
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

### Cloudflare Configuration

The project is configured for:

- **Domain**: speechnote.ai (custom domain in wrangler.jsonc)
- **D1 Database**: ai-speechnote-db
- **R2 Bucket**: ai-speechnote-downloads (for app installers)
- **Workers Compatibility**: nodejs_compat flag enabled

### Important Notes

- **Package manager: PNPM ONLY** - This project exclusively uses pnpm. Never use npm, yarn, or other package managers
- Database migrations must be applied to both local and remote D1
- BetterAuth handles `/api/auth/*` routes automatically
- TailwindCSS v4 configured via Vite plugin
- MDSveX enabled for Markdown in Svelte components
- The desktop app is in `../desktop-asr` - a Tauri/Rust application

### Common Tasks

**Add a new database table**:

1. Edit `src/lib/server/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:push` for local development
4. Run `npx wrangler d1 migrations apply ai-speechnote-db --remote` for production

**Test authentication locally**:

1. Ensure `.env` has BETTER_AUTH_SECRET set
2. Google OAuth requires valid client ID/secret
3. Email OTP requires Mailgun configuration

**Deploy to production**:

1. Ensure all secrets are set in Cloudflare: `npx wrangler secret put SECRET_NAME`
2. Run `pnpm deploy`
3. Apply any pending migrations to remote D1
