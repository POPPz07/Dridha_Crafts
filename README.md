# Dridha Crafts — Handmade in the Kashmir Valley 🌲

Premium e-commerce website for handcrafted wooden desk accessories made from sustainably sourced fallen trees in the Kashmir Valley.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| **Animations** | GSAP + ScrollTrigger, Lenis, Framer Motion |
| **Backend** | FastAPI (Python 3.10+), SQLAlchemy, Pydantic v2 |
| **Database** | Supabase (PostgreSQL) with Auth, Storage, RLS |
| **Deployment** | Vercel (frontend) + Render (backend) |

## Project Structure

```
dridhacrafts/
├── frontend/          # Next.js application
├── backend/           # FastAPI application
├── supabase/          # Database migrations & config
│   └── migrations/    # SQL migration files
└── venv/              # Python virtual environment
```

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Python 3.10+
- Supabase account

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase keys
npm run dev
```

### Backend Setup
```bash
# From the project root
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase keys
uvicorn app.main:app --reload
```

### Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in the Supabase dashboard
3. Run `supabase/migrations/001_initial_schema.sql`
4. The initial product catalog will be seeded automatically

## Environment Variables

See `frontend/.env.example` and `backend/.env.example` for required variables.

## License

Private — All rights reserved © 2026 Dridha Crafts
