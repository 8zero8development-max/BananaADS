# Banana Ads - AI Cinematography Agent

## Overview
Banana Ads is an AI-powered cinematography agent built with React and Google Gemini. It helps brands create broadcast-quality advertisement concepts, storyboards, scripts, and video assets.

## Project Structure
- `/` - Root contains main React components and configuration
- `server/` - Express backend server with Stripe integration
- `services/` - Contains Gemini AI service integrations
- `utils/` - Utility functions (audio utilities)

## Tech Stack
- **Frontend:** React 19, Tailwind CSS (via CDN)
- **Build Tool:** Vite
- **Backend:** Express.js on port 3001
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Replit Auth (OpenID Connect)
- **AI Integration:** Google Gemini (@google/genai)
- **Payments:** Stripe with stripe-replit-sync
- **Testing:** Vitest with React Testing Library

## Architecture
- **Frontend (port 5000):** React/Vite serves landing page and main app
- **Backend (port 3001):** Express handles Stripe API calls
- **Vite Proxy:** `/api/*` routes proxied to backend during development

## Development
- **Dev Server:** `npm run dev` - runs frontend (5000) and backend (3001) concurrently
- **Build:** `npm run build` - outputs to `dist/`
- **Test:** `npm run test`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API key (managed by Replit integration)
- `SESSION_SECRET` - Session encryption key (managed by Replit)

## Authentication
Users must sign in to access the app. Replit Auth provides:
- Login with Google, GitHub, Apple, X, or email/password
- Auth routes: `/api/login`, `/api/logout`, `/api/auth/user`
- Database tables: `users` (user profiles), `sessions` (session storage)
- Frontend hook: `useAuth()` in `hooks/useAuth.ts`

## API Key Management
Users provide their own Gemini API key which is stored in browser localStorage:
- No server-side API key required
- Users get free keys from https://aistudio.google.com/app/apikey
- Key stored securely in browser only (never sent to our servers)
- Users can change/clear their key via the "API Key" button in the app header

## Deployment
- Autoscale deployment configured
- Build command: `npm run build`
- Run command: `npm run start`

## Stripe Products
Three subscription tiers configured in Stripe:
1. **Starter ($29/mo):** 5 ad campaigns/month
2. **Professional ($79/mo):** Unlimited campaigns with voiceovers  
3. **Enterprise ($199/mo):** Video generation, API access, unlimited everything
