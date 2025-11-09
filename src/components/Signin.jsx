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

            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
                <div className="max-w-md w-full mx-auto px-4">
                    <form onSubmit={handleSignIn} className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                        <h2 className="text-3xl font-bold text-[#881c1c] pb-2 mb-4">Sign In</h2>
                        <p className="text-gray-600 mb-6">
                            Don't have an account? <Link to="/signup" className="text-[#881c1c] hover:text-[#6b1515] font-semibold underline">Sign up!</Link>
                        </p>
                        <div className="flex flex-col py-4">
                            <input 
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError(""); // Clear error when user types
                                }}
                                value={email}
                                placeholder="Email" 
                                className="p-3 mt-4 border-2 border-gray-300 rounded-lg focus:border-[#881c1c] focus:outline-none" 
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
                                className="p-3 mt-4 border-2 border-gray-300 rounded-lg focus:border-[#881c1c] focus:outline-none" 
                                type="password" 
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={loading} 
                                style={{ backgroundColor: '#881c1c' }}
                                className="mt-6 w-full text-umass-cream py-3 px-4 rounded-lg hover:bg-[#6b1515] font-semibold transition-colors disabled:opacity-50 shadow-md cursor-pointer"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                            {error && !notification.message && (
                                <div className="mt-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                                    <p className="text-red-600 text-center font-semibold">{error}</p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
};

export default Signin