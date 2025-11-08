import React from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ApiTest from './ApiTest';


const Dashboard = () => {
    const { session, signOut } = UserAuth();
    const navigate = useNavigate();

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
            <div className="p-4 border-b-2 border-umass-maroon bg-white shadow-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-umass-maroon">Dashboard</h1>
                        <p className="text-umass-gray">Welcome, {session?.user?.email}</p>
                    </div>
                    <button 
                        onClick={handleSignOut}
                        className="px-4 py-2 border-2 border-umass-maroon text-umass-maroon rounded-lg hover:bg-umass-lightGray font-semibold transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link
                        to="/my-items"
                        className="p-6 border-2 border-umass-maroon rounded-lg hover:bg-umass-lightGray hover:shadow-lg transition-all"
                    >
                        <h3 className="text-xl font-bold mb-2 text-umass-maroon">My Items</h3>
                        <p className="text-umass-gray">Manage your listed items</p>
                    </Link>
                    <Link
                        to="/borrow-requests"
                        className="p-6 border-2 border-umass-maroon rounded-lg hover:bg-umass-lightGray hover:shadow-lg transition-all"
                    >
                        <h3 className="text-xl font-bold mb-2 text-umass-maroon">Borrow Requests</h3>
                        <p className="text-umass-gray">View and manage requests</p>
                    </Link>
                    <Link
                        to="/items/new"
                        className="p-6 border-2 border-umass-maroon rounded-lg hover:bg-umass-lightGray hover:shadow-lg transition-all"
                    >
                        <h3 className="text-xl font-bold mb-2 text-umass-maroon">Create Item</h3>
                        <p className="text-umass-gray">List a new item</p>
                    </Link>
                </div>
            </div>
            
            {/* API Test Panel (for testing) */}
            <div className="border-t">
                <ApiTest />
            </div>
        </div>
    )
}

export default Dashboard