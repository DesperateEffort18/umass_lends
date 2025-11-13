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
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4">
                <form onSubmit={handleSignUp} className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                    <h2 className="text-3xl font-bold text-[#881c1c] pb-2 mb-4">Sign Up Today!</h2>
                    <p className="text-gray-600 mb-2">
                        Already have an account? <Link to="/signin" className="text-[#881c1c] hover:text-[#6b1515] font-semibold underline">Sign in!</Link>
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
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
                            className={`p-3 mt-4 border-2 rounded-lg focus:outline-none ${
                                emailError 
                                    ? 'border-red-400 focus:border-red-500' 
                                    : 'border-gray-300 focus:border-[#881c1c]'
                            }`}
                            type="email" 
                            required
                        />
                        {emailError && (
                            <p className="text-red-600 text-sm mt-1">{emailError}</p>
                        )}
                        <input 
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            placeholder="Password" 
                            className="p-3 mt-4 border-2 border-gray-300 rounded-lg focus:border-[#881c1c] focus:outline-none" 
                            type="password" 
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={loading || emailSent} 
                            style={{ backgroundColor: '#881c1c' }}
                            className="mt-6 w-full text-umass-cream py-3 px-4 rounded-lg hover:bg-[#6b1515] font-semibold transition-colors disabled:opacity-50 shadow-md cursor-pointer"
                        >
                            {loading ? 'Signing up...' : emailSent ? 'Check Your Email' : 'Sign Up'}
                        </button>
                        
                        {emailSent && (
                            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3 className="text-sm font-semibold text-blue-800 mb-1">
                                            Check Your Email
                                        </h3>
                                        <p className="text-sm text-blue-700 mb-3">
                                            We've sent a confirmation email to <strong>{email}</strong>. 
                                            Please check your inbox and click the confirmation link to activate your account.
                                        </p>
                                        <p className="text-xs text-blue-600 mb-3">
                                            <strong>Note:</strong> Check your spam folder if you don't see the email. 
                                            The email may take a few minutes to arrive.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleResendEmail}
                                            disabled={resendLoading}
                                            className="text-sm text-blue-800 hover:text-blue-900 font-semibold underline disabled:opacity-50"
                                        >
                                            {resendLoading ? 'Sending...' : resendSuccess ? 'Email Sent!' : "Didn't receive it? Resend confirmation email"}
                                        </button>
                                        {resendSuccess && (
                                            <p className="text-xs text-green-600 mt-2">✓ Confirmation email resent successfully!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {error && !emailSent && (
                            <div className="mt-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                                <p className="text-red-600 text-center font-semibold">{error}</p>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
};

export default Signup