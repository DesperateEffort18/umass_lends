-- Brute Force Protection Setup
-- Run this in your Supabase SQL Editor to enable brute force protection

-- Create failed_logins table
CREATE TABLE IF NOT EXISTS public.failed_logins (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    attempts SMALLINT NOT NULL DEFAULT 1,
    last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON public.failed_logins(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_last_attempt ON public.failed_logins(last_attempt);

-- Enable Row Level Security
ALTER TABLE public.failed_logins ENABLE ROW LEVEL SECURITY;

-- Policy: Allow the functions to access the table (security definer functions bypass RLS)
-- We don't need explicit policies since functions use SECURITY DEFINER

-- Function: Record a failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(p_email TEXT)
RETURNS VOID AS $$
DECLARE
    exists_row BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.failed_logins WHERE email = p_email) INTO exists_row;
    
    IF exists_row THEN
        UPDATE public.failed_logins
        SET attempts = attempts + 1,
            last_attempt = NOW()
        WHERE email = p_email;
    ELSE
        INSERT INTO public.failed_logins (email, attempts, last_attempt)
        VALUES (p_email, 1, NOW());
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if an email is blocked due to brute force
-- Returns TRUE if 6+ attempts in the last 15 minutes
CREATE OR REPLACE FUNCTION public.check_bruteforce(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    tries INT;
BEGIN
    SELECT attempts INTO tries
    FROM public.failed_logins
    WHERE email = p_email
      AND NOW() - last_attempt < INTERVAL '15 minutes';
    
    RETURN COALESCE(tries >= 6, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reset failed login attempts for an email (called on successful login)
CREATE OR REPLACE FUNCTION public.reset_failed_login(p_email TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.failed_logins WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a function to clean up old records (older than 24 hours)
-- This can be called periodically via a cron job or manually
CREATE OR REPLACE FUNCTION public.cleanup_old_failed_logins()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.failed_logins
    WHERE NOW() - last_attempt > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (for RPC calls)
GRANT EXECUTE ON FUNCTION public.record_failed_login(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_bruteforce(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_failed_login(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_failed_logins() TO authenticated;

