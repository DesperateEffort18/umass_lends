import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const [emailError, setEmailError] = useState("");
const [emailSent, setEmailSent] = useState(false);
const [resendLoading, setResendLoading] = useState(false);
const [resendSuccess, setResendSuccess] = useState(false);

const { session, signUpNewUser, resendConfirmationEmail } = UserAuth();
const navigate = useNavigate();
//console.log(session);


const handleSignUp = async (e) =>{
    e.preventDefault()
    setError("") // Clear previous errors
    setEmailError("") // Clear email error
    setEmailSent(false) // Reset email sent state
    
    // Validate UMass email
    const emailLower = email.toLowerCase().trim()
    if (!emailLower.endsWith('@umass.edu')) {
        setError("Email must be a UMass Amherst email address (@umass.edu)")
        setEmailError("Must be a UMass email (@umass.edu)")
        return
    }
    
    setLoading(true)
    try{
        const result = await signUpNewUser(emailLower, password)

        if(result.success){
            // Check if email confirmation is required
            if(result.needsConfirmation) {
                // Email confirmation required - show message to user
                setEmailSent(true);
                setError(""); // Clear any errors
            } else if(result.data?.session) {
                // User is automatically logged in (email confirmation disabled)
                navigate('/dashboard');
            } else {
                // Fallback: assume email confirmation is needed
                setEmailSent(true);
            }
        } else if(result.error) {
            setError(result.error.message || "An error occurred during sign up")
        }
    } catch(err) {
        setError("An error occurred. Please try again.");

    } finally {
        setLoading(false); // maybe setLoading
    }

};

const handleResendEmail = async () => {
    const emailLower = email.toLowerCase().trim();
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    
    try {
        const result = await resendConfirmationEmail(emailLower);
        if(result.success) {
            setResendSuccess(true);
            setTimeout(() => setResendSuccess(false), 5000);
        } else if(result.error) {
            setError(result.error.message || "Failed to resend confirmation email");
        }
    } catch(err) {
        setError("Failed to resend confirmation email. Please try again.");
    } finally {
        setResendLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-gradient-paper flex items-center justify-center relative z-10 py-12">
            <div className="max-w-md w-full mx-auto px-6">
                <form onSubmit={handleSignUp} className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl border-2 border-umass-maroon/20 relative overflow-hidden animate-fade-in-up">
                    {/* Decorative accent */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-umass-maroon/5 to-transparent rounded-bl-full"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-4xl font-display font-bold text-umass-maroonDark pb-2 mb-4 tracking-tight">Sign Up Today!</h2>
                        <p className="text-umass-stone/70 mb-2 font-body">
                            Already have an account? <Link to="/signin" className="text-umass-maroon hover:text-umass-maroonDark font-accent font-semibold underline transition-colors">Sign in!</Link>
                        </p>
                        <p className="text-sm text-umass-stone/60 mb-6 font-body">
                            Note: Only UMass Amherst email addresses (@umass.edu) are accepted.
                        </p>
                        <div className="flex flex-col py-4">
                            <input 
                                onChange={(e) => {
                                    const emailValue = e.target.value;
                                    setEmail(emailValue);
                                    // Clear error when user starts typing
                                    if (error) setError("");
                                    // Real-time validation feedback
                                    if (emailValue && !emailValue.toLowerCase().trim().endsWith('@umass.edu')) {
                                        setEmailError("Must be a UMass email (@umass.edu)");
                                    } else {
                                        setEmailError("");
                                    }
                                }}
                                value={email}
                                placeholder="your.email@umass.edu" 
                                className={`p-4 mt-4 border-2 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm hover:shadow-md font-body text-umass-charcoal placeholder:text-umass-stone/40 ${
                                    emailError 
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' 
                                        : 'border-umass-maroon/20 focus:border-umass-maroon focus:ring-umass-maroon/20'
                                }`}
                                type="email" 
                                required
                            />
                            {emailError && (
                                <p className="text-red-600 text-sm mt-2 font-accent font-semibold uppercase tracking-wide">{emailError}</p>
                            )}
                            <input 
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                placeholder="Password" 
                                className="p-4 mt-4 border-2 border-umass-maroon/20 rounded-lg bg-white/80 backdrop-blur-sm focus:border-umass-maroon focus:outline-none focus:ring-2 focus:ring-umass-maroon/20 font-body text-umass-charcoal placeholder:text-umass-stone/40 transition-all duration-300 shadow-sm hover:shadow-md" 
                                type="password" 
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={loading || emailSent} 
                                className="mt-6 w-full bg-gradient-maroon text-umass-cream py-4 px-6 rounded-lg hover:bg-gradient-to-r hover:from-umass-maroonDark hover:to-umass-maroon font-accent font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                            >
                                {loading ? 'Signing up...' : emailSent ? 'Check Your Email' : 'Sign Up'}
                            </button>
                        
                        {emailSent && (
                            <div className="mt-4 p-5 bg-blue-50/80 backdrop-blur-sm border-l-4 border-blue-400 rounded-lg shadow-md animate-fade-in-up">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3 className="text-sm font-accent font-bold uppercase tracking-wide text-blue-800 mb-2">
                                            Check Your Email
                                        </h3>
                                        <p className="text-sm text-blue-700 mb-3 font-body leading-relaxed">
                                            We've sent a confirmation email to <strong className="font-accent">{email}</strong>. 
                                            Please check your inbox and click the confirmation link to activate your account.
                                        </p>
                                        <p className="text-xs text-blue-600 mb-3 font-body">
                                            <strong className="font-accent">Note:</strong> Check your spam folder if you don't see the email. 
                                            The email may take a few minutes to arrive.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleResendEmail}
                                            disabled={resendLoading}
                                            className="text-sm text-blue-800 hover:text-blue-900 font-accent font-bold uppercase tracking-wide underline disabled:opacity-50 transition-colors"
                                        >
                                            {resendLoading ? 'Sending...' : resendSuccess ? 'Email Sent!' : "Didn't receive it? Resend confirmation email"}
                                        </button>
                                        {resendSuccess && (
                                            <p className="text-xs text-emerald-600 mt-2 font-accent font-semibold">✓ Confirmation email resent successfully!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {error && !emailSent && (
                            <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm border-l-4 border-red-400 rounded-lg shadow-md animate-fade-in-up">
                                <p className="text-red-700 text-center font-accent font-semibold uppercase tracking-wide text-sm">{error}</p>
                            </div>
                        )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
};

export default Signup