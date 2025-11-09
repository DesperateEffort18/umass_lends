import React from 'react';
import { UserAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';


const Dashboard = () => {
    const { session } = UserAuth();
    return (
        <div>
            <div className="p-4 border-b-2 border-umass-maroon bg-white shadow-sm">
                <div className="container mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-umass-maroon">Dashboard</h1>
                        <p className="text-umass-gray">Welcome, {session?.user?.email}</p>
                    </div>
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
        </div>
    )
}

export default Dashboard