# Supabase Authentication Setup

This application now uses Supabase for authentication instead of the demo credentials.

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration (optional)
VITE_API_URL=https://gama-backend.onrender.com/api
```

## Supabase Setup Steps

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from Settings > API

2. **Set up Authentication**
   - Go to Authentication > Settings in your Supabase dashboard
   - Configure your authentication providers
   - Set up email/password authentication

3. **Create Users Table**
   - In your Supabase SQL editor, run the following to create the users table:

```sql
-- Create users table that extends Supabase auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'instructor',
  branch_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name', 'instructor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. **Add Environment Variables to Vercel**
   - Go to your Vercel project settings
   - Add the environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

## User Management

- Users will be created automatically when they sign up through Supabase
- Admin users can be created manually in the Supabase dashboard or through SQL
- User roles are managed in the `users` table

## Security

- All authentication is handled by Supabase
- JWT tokens are managed automatically
- Row Level Security (RLS) is enabled on the users table
- Users can only access their own profile data
