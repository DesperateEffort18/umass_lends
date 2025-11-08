/**
 * Navigation Bar Component
 * Top navigation for the app
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

const Navbar = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <nav className="bg-umass-maroon text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold hover:text-umass-maroonLight transition-colors">
          🏛️ UMass Lends
        </Link>
        
        <div className="flex gap-4 items-center">
          <Link to="/" className="hover:text-umass-maroonLight transition-colors font-medium">
            Browse
          </Link>
          
          {session ? (
            <>
              <Link to="/my-items" className="hover:text-umass-maroonLight transition-colors font-medium">
                My Items
              </Link>
              <Link to="/borrow-requests" className="hover:text-umass-maroonLight transition-colors font-medium">
                Requests
              </Link>
              <Link to="/items/new" className="hover:text-umass-maroonLight transition-colors font-medium">
                List Item
              </Link>
              <Link to="/dashboard" className="hover:text-umass-maroonLight transition-colors font-medium">
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="hover:text-umass-maroonLight transition-colors font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="hover:text-umass-maroonLight transition-colors font-medium">
                Sign In
              </Link>
              <Link to="/signup" className="bg-white text-umass-maroon px-4 py-2 rounded-lg hover:bg-umass-lightGray transition-colors font-medium">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

