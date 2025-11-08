import React from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiTest from './ApiTest';


const Dashboard = () => {
    const { session, signOut } = UserAuth();
    const navigate = useNavigate();

    console.log(session);

    const handleSignOut = async (e) => {
        e.preventDefault();
        try{
            await signOut();
            navigate("/");
        } catch (err) {
            console.error(err);
        }
    };
    return (
        <div>
            <div className="p-4 border-b">
                <h1>Dashboard</h1>
                <h2>Welcome, {session?.user?.email}</h2>
                <button 
                    onClick={handleSignOut}
                    className="hover:cursor-pointer border inline-block px-4 py-3 mt-4"
                >
                    Sign out
                </button>
            </div>
            
            {/* API Test Panel */}
            <ApiTest />
        </div>
    )
}

export default Dashboard