import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useNotification } from "../hooks/useNotification";
import Notification from "../components/Notification";

const Signin = () => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const { session, signInUser } = UserAuth();
const navigate = useNavigate();
const { notification, showError, showWarning, hideNotification } = useNotification();

const handleSignIn = async (e) =>{
    e.preventDefault()
    setError(""); // Clear previous errors
    hideNotification(); // Clear previous notifications
    setLoading(true)
    
    try{
        const result = await signInUser(email, password)

        if(result.success){
            navigate('/dashboard')
        } else if(result.error) {
            // Handle brute force blocked message
            if(result.bruteForceBlocked) {
                showWarning(result.error);
            } else {
                // Show error notification for other errors
                showError(result.error);
                setError(result.error);
            }
        }
    } catch(err) {
        const errorMessage = err.message || "An error occurred. Please try again.";
        showError(errorMessage);
        setError(errorMessage);
    } finally {
        setLoading(false); 
    }

};

    return (
        <>
            {/* Notification Component */}
            {notification.message && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={hideNotification}
                    duration={notification.type === 'warning' ? 10000 : 5000} // Show brute force warnings longer
                />
            )}

            <div className="min-h-screen bg-gradient-paper flex items-center justify-center relative z-10 py-12">
                <div className="max-w-md w-full mx-auto px-6">
                    <form onSubmit={handleSignIn} className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl border-2 border-umass-maroon/20 relative overflow-hidden animate-fade-in-up">
                        {/* Decorative accent */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-umass-maroon/5 to-transparent rounded-bl-full"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-4xl font-display font-bold text-umass-maroonDark pb-2 mb-4 tracking-tight">Sign In</h2>
                            <p className="text-umass-stone/70 mb-6 font-body">
                                Don't have an account? <Link to="/signup" className="text-umass-maroon hover:text-umass-maroonDark font-accent font-semibold underline transition-colors">Sign up!</Link>
                            </p>
                            <div className="flex flex-col py-4">
                                <input 
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError(""); // Clear error when user types
                                    }}
                                    value={email}
                                    placeholder="Email" 
                                    className="p-4 mt-4 border-2 border-umass-maroon/20 rounded-lg bg-white/80 backdrop-blur-sm focus:border-umass-maroon focus:outline-none focus:ring-2 focus:ring-umass-maroon/20 font-body text-umass-charcoal placeholder:text-umass-stone/40 transition-all duration-300 shadow-sm hover:shadow-md" 
                                    type="email" 
                                    required
                                />
                                <input 
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError(""); // Clear error when user types
                                    }}
                                    value={password}
                                    placeholder="Password" 
                                    className="p-4 mt-4 border-2 border-umass-maroon/20 rounded-lg bg-white/80 backdrop-blur-sm focus:border-umass-maroon focus:outline-none focus:ring-2 focus:ring-umass-maroon/20 font-body text-umass-charcoal placeholder:text-umass-stone/40 transition-all duration-300 shadow-sm hover:shadow-md" 
                                    type="password" 
                                    required
                                />
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="mt-6 w-full bg-gradient-maroon text-umass-cream py-4 px-6 rounded-lg hover:bg-gradient-to-r hover:from-umass-maroonDark hover:to-umass-maroon font-accent font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                                {error && !notification.message && (
                                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-md animate-fade-in-up">
                                        <p className="text-red-700 text-center font-accent font-semibold uppercase tracking-wide text-sm">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
};

export default Signin