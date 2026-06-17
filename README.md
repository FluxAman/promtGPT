# PromptGPT

> AI Image Prompt Library — Browse, search, and copy thousands of AI image prompts organized by category.

## Tech Stack

| Layer       | Technology                     |
| ----------- | ------------------------------ |
| Framework   | Next.js 16 (App Router)        |
| Language    | TypeScript                     |
| Styling     | Tailwind CSS 4 + shadcn/ui     |
| Database    | Supabase (PostgreSQL + Auth)   |
| Storage     | Cloudinary (image uploads)     |
| Deployment  | Vercel                         |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudinary](https://cloudinary.com) account

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/FluxAman/promtGPT.git
cd promtGPT

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.example .env.local
# Fill in your Supabase & Cloudinary keys

# 4. Run the database schema
# Copy supabase/schema.sql into your Supabase SQL Editor and run it

# 5. Start dev server
npm run dev
```


## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # Server-side API endpoints
│   │   ├── admin/          #   Admin actions (approve/reject)
│   │   ├── auth/           #   OAuth callback
│   │   ├── prompts/        #   CRUD for prompts
│   │   ├── search/         #   Full-text search
│   │   └── upload/         #   Cloudinary image upload
│   ├── category/[slug]/    # Category browse page
│   ├── profile/            # User profile (submissions & saved)
│   ├── prompt/[id]/        # Prompt detail & edit pages
│   ├── search/             # Search results page
│   ├── submit/             # Submit new prompt page
│   ├── admin/              # Admin dashboard
│   ├── globals.css         # Global styles & design tokens
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components
│   ├── ui/                 #   shadcn/ui primitives
│   ├── AuthButton.tsx      #   Login/signup with dropdown
│   ├── CategoryGrid.tsx    #   Category card grid
│   ├── CopyButton.tsx      #   Copy prompt to clipboard
│   ├── LoadingSkeleton.tsx  #   Loading placeholder
│   ├── Navbar.tsx          #   Top navigation bar
│   ├── PromptCard.tsx      #   Prompt display card
│   ├── SaveButton.tsx      #   Bookmark/save prompt
│   └── SearchBar.tsx       #   Search input with autocomplete
├── lib/                    # Shared utilities & configs
│   ├── supabase/           #   Supabase client (server & browser)
│   ├── cloudinary.ts       #   Cloudinary config
│   └── utils.ts            #   Utility functions (cn)
├── types/                  # TypeScript type definitions
│   └── index.ts            #   Prompt, Category, SavedPrompt types
└── middleware.ts            # Supabase auth session refresh
```

## Scripts

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `npm run dev`    | Start dev server             |
| `npm run build`  | Production build             |
| `npm run start`  | Start production server      |
| `npm run lint`   | Run ESLint                   |
| `npm run seed`   | Seed database from GitHub    |

## License

Private project.
