# Banana Ads - AI Cinematography Agent

## Overview
Banana Ads is an AI-powered cinematography agent built with React and Google Gemini. It helps brands create broadcast-quality advertisement concepts, storyboards, scripts, and video assets.

## Project Structure
- `/` - Root contains main React components and configuration
- `services/` - Contains Gemini AI service integrations
- `utils/` - Utility functions (audio utilities)

## Tech Stack
- **Frontend:** React 19, Tailwind CSS (via CDN)
- **Build Tool:** Vite
- **AI Integration:** Google Gemini (@google/genai)
- **Testing:** Vitest with React Testing Library

## Development
- **Dev Server:** `npm run dev` - runs on port 5000
- **Build:** `npm run build` - outputs to `dist/`
- **Test:** `npm run test`

## Environment Variables
- `GEMINI_API_KEY` - Required for AI features

## Deployment
- Static deployment configured
- Build command: `npm run build`
- Output directory: `dist`
