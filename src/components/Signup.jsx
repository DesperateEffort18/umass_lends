import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const { session,signUpNewUser } = UserAuth();
const navigate = useNavigate();
//console.log(session);


const handleSignUp = async (e) =>{
    e.preventDefault()
    setLoading(true)
    try{
        const result = await signUpNewUser(email, password)

        if(result.success){
            navigate('/dashboard')
        }
    } catch(err) {
        setError("an error occured");

    } finally {
        setLoading(false); // maybe setLoading
    }

};

    return (
        <div className="min-h-screen bg-umass-lightGray flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4">
                <form onSubmit={handleSignUp} className="bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold text-umass-maroon pb-2 mb-4">Sign Up Today!</h2>
                    <p className="text-umass-gray mb-6">
                        Already have an account? <Link to="/signin" className="text-umass-maroon hover:text-umass-maroonDark font-semibold">Sign in!</Link>
                    </p>
                    <div className="flex flex-col py-4">
                        <input 
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email" 
                            className="p-3 mt-4 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none" 
                            type="email" 
                        />
                        <input 
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password" 
                            className="p-3 mt-4 border-2 border-gray-300 rounded-lg focus:border-umass-maroon focus:outline-none" 
                            type="password" 
                        />
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="mt-6 w-full bg-umass-maroon text-white py-3 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                        {error && <p className="text-red-600 text-center pt-4">{error}</p>}
                    </div>
                </form>
            </div>
        </div>
    )
};

export default Signup