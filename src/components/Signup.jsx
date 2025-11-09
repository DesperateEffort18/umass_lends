import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const [emailError, setEmailError] = useState("");

const { session,signUpNewUser } = UserAuth();
const navigate = useNavigate();
//console.log(session);


const handleSignUp = async (e) =>{
    e.preventDefault()
    setError("") // Clear previous errors
    setEmailError("") // Clear email error
    
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
            navigate('/dashboard')
        } else if(result.error) {
            setError(result.error.message || "An error occurred during sign up")
        }
    } catch(err) {
        setError("An error occurred. Please try again.");

    } finally {
        setLoading(false); // maybe setLoading
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
                            disabled={loading} 
                            style={{ backgroundColor: '#881c1c' }}
                            className="mt-6 w-full text-umass-cream py-3 px-4 rounded-lg hover:bg-[#6b1515] font-semibold transition-colors disabled:opacity-50 shadow-md cursor-pointer"
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                        {error && (
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