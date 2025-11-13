import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/**
 * Auth Callback Page
 * Handles email confirmation redirects from Supabase
 * Supabase automatically processes tokens from URL hash when the page loads
 */
const AuthCallback = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        // Check for errors in URL hash first
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
            console.error('Auth callback error:', error, errorDescription);
            setStatus('error');
            setMessage(errorDescription || error || 'Email confirmation failed. Please try again.');
            // Clear the hash
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => navigate('/signin'), 5000);
            return;
        }

        // Listen for auth state changes
        // Supabase will automatically process tokens from the URL hash
        let timeoutId;
        let isHandled = false;
        
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (isHandled) return;
            
            console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
            
            if (event === 'SIGNED_IN' && session) {
                // User successfully confirmed email and signed in
                isHandled = true;
                if (timeoutId) clearTimeout(timeoutId);
                setStatus('success');
                setMessage('Email confirmed successfully! Redirecting to dashboard...');
                // Clear the hash
                window.history.replaceState(null, '', window.location.pathname);
                setTimeout(() => navigate('/dashboard'), 2000);
            } else if (event === 'TOKEN_REFRESHED' && session) {
                // Session refreshed
                isHandled = true;
                if (timeoutId) clearTimeout(timeoutId);
                setStatus('success');
                setMessage('Session refreshed! Redirecting to dashboard...');
                window.history.replaceState(null, '', window.location.pathname);
                setTimeout(() => navigate('/dashboard'), 2000);
            } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION' && event !== 'USER_UPDATED')) {
                // No session or signed out (but ignore initial session check)
                isHandled = true;
                if (timeoutId) clearTimeout(timeoutId);
                setStatus('error');
                setMessage('Failed to confirm email. Please try signing up again or resend the confirmation email.');
                window.history.replaceState(null, '', window.location.pathname);
                setTimeout(() => navigate('/signup'), 5000);
            }
        });

        // Also check current session immediately
        
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (isHandled) return;
            
            if (error) {
                console.error('Session error:', error);
                isHandled = true;
                setStatus('error');
                setMessage('Failed to verify session. Please try signing in.');
                setTimeout(() => navigate('/signin'), 5000);
            } else if (session) {
                // Already has session - redirect immediately
                isHandled = true;
                setStatus('success');
                setMessage('You are already signed in! Redirecting...');
                window.history.replaceState(null, '', window.location.pathname);
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                // No session yet - wait for auth state change or timeout
                // Give it a few seconds, then check again
                timeoutId = setTimeout(() => {
                    if (isHandled) return;
                    
                    supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
                        if (isHandled) return;
                        
                        if (retrySession) {
                            isHandled = true;
                            setStatus('success');
                            setMessage('Email confirmed successfully! Redirecting to dashboard...');
                            window.history.replaceState(null, '', window.location.pathname);
                            setTimeout(() => navigate('/dashboard'), 2000);
                        } else {
                            // Still processing or no tokens found
                            isHandled = true;
                            setStatus('error');
                            setMessage('Invalid or expired confirmation link. Please try signing up again.');
                            window.history.replaceState(null, '', window.location.pathname);
                            setTimeout(() => navigate('/signup'), 5000);
                        }
                    });
                }, 3000);
            }
        });

        // Cleanup subscription and timeout on unmount
        return () => {
            subscription.unsubscribe();
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4">
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center">
                    {status === 'processing' && (
                        <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#881c1c] mx-auto mb-4"></div>
                            <h2 className="text-2xl font-bold text-[#881c1c] mb-2">Verifying Email</h2>
                            <p className="text-gray-600">{message}</p>
                        </>
                    )}
                    
                    {status === 'success' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">Email Confirmed!</h2>
                            <p className="text-gray-600">{message}</p>
                        </>
                    )}
                    
                    {status === 'error' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Confirmation Failed</h2>
                            <p className="text-gray-600 mb-4">{message}</p>
                            <button
                                onClick={() => navigate('/signin')}
                                className="mt-4 px-4 py-2 bg-[#881c1c] text-white rounded-lg hover:bg-[#6b1515] transition-colors"
                            >
                                Go to Sign In
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthCallback;

