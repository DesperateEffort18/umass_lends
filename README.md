# UMass Lends

A secure platform for UMass students to find and borrow items temporarily. Save money by borrowing what you need instead of buying!

## 🌟 Features

- **Item Management**: Browse, create, and manage items to lend or borrow
- **Borrowing System**: Request items, approve/reject requests, track pickups and returns
- **Real-Time Messaging**: Private messaging between item owners and borrowers
- **AI-Powered Recommendations**: Smart recommendations based on academic calendar (midterms, finals, etc.)
- **Custom Requests**: Create requests for items you're looking for
- **User Profiles**: Manage your profile, view activity history
- **Security**: Secure authentication, protected routes, item reporting

## 🤖 AI Capabilities

The platform uses **OpenAI GPT-4o-mini** to provide intelligent recommendations:
- Automatically detects academic periods (semester start, midterms, finals, summer, etc.)
- Recommends relevant items based on current time of year
- Provides explanations for recommendations
- Falls back to rule-based recommendations if AI is unavailable

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- OpenAI API key (optional, for AI recommendations)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/umass_lends.git
   cd umass_lends
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # API URL (optional - defaults to http://localhost:3000)
   VITE_API_URL=http://localhost:3000
   
   # OpenAI API Key (optional - for AI recommendations)
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up database**:
   
   Run the SQL scripts in the `database/` directory to set up your database schema.

5. **Set up Supabase Storage**:
   
   Create storage buckets:
   - `item-images` - For item images
   - `profile-pictures` - For user profile pictures

### Running Locally

**Start the backend**:
```bash
npm run dev:backend
```
Backend runs on `http://localhost:3000`

**Start the frontend** (in a new terminal):
```bash
npm run dev:frontend
```
Frontend runs on `http://localhost:5173`

**Access the application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## 🛠️ Technology Stack

- **Frontend**: React, React Router, Vite, Tailwind CSS
- **Backend**: Next.js, TypeScript, Supabase
- **Database**: PostgreSQL (via Supabase)
- **AI**: OpenAI GPT-4o-mini
- **Storage**: Supabase Storage

## 📝 Available Scripts

- `npm run dev:backend` - Start backend server
- `npm run dev:frontend` - Start frontend development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## 🔒 Security

- Secure authentication with Supabase
- Protected routes requiring authentication
- Row-level security in database
- Input validation with Zod
- Secure image storage


