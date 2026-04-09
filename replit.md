# Syncra Voting

A modern, real-time voting system for institutions to manage elections. Built with React + Vite + TypeScript, powered by Supabase for the backend/database.

## Features

- Admin dashboard to create and manage elections, categories, and candidates
- Voter registration with unique identifiers and OTP support
- Real-time vote count updates via Supabase subscriptions
- Secure vote submission via SQL stored procedures

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide React
- **Routing:** React Router DOM v7
- **Backend/Database:** Supabase (PostgreSQL + Real-time)
- **Build Tool:** Vite 8
- **Package Manager:** npm

## Project Structure

```
src/
  assets/       # Images and static media
  components/   # Reusable UI components (Layout, etc.)
  lib/          # Supabase client initialization
  pages/        # Route-level components (Dashboard, VotePage, etc.)
  types/        # TypeScript interfaces
  App.tsx       # Main routing
  main.tsx      # Entry point
supabase/
  schema.sql    # Database schema and stored procedures
```

## Environment Variables

The Supabase credentials are embedded as fallbacks in `src/lib/supabase.ts`. To override:
- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anonymous key

## Development

```bash
npm install
npm run dev   # Starts on port 5000
```

## Deployment

Configured as a static site: runs `npm run build`, serves the `dist/` folder.
