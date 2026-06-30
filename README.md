# Mount Lotus Funnel Report

Daily marketing funnel dashboard for Mount Lotus Eye & ENT Hospital, tracking Meta (Facebook/Instagram) ad performance against reception call logs and patient outcomes.

## Tech Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database/Auth**: Supabase

---

## Getting Started Locally

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the results.

---

## Deploying to Vercel

1. Push the code to a GitHub repository.
2. Import the project into Vercel.
3. In Vercel Project Settings, navigate to **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

---

## Creating the First Staff Account in Supabase

Since public signup is disabled to protect hospital data, staff credentials must be created directly in the Supabase console:

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Navigate to **Authentication** (sidebar lock icon).
4. Click **Add User** → **Create User** on the top right.
5. Enter the staff member's email address and password.
6. Toggle off **Send auto-confirmation email** (or confirm manually) and click **Save**.
7. Staff can now log in at `/login` and manage data at `/admin`.
