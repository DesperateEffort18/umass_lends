/**
 * Navigation Bar Component
 * Top navigation for the app
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { borrowAPI } from '../utils/api';

const Navbar = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [logoError, setLogoError] = useState(false);

  // Fetch pending requests count for items the user owns
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!session) {
        setPendingCount(0);
        return;
      }

      try {
        const response = await borrowAPI.getMine('pending');
        if (response.success && response.data) {
          // Count only requests where user is the owner (requests for their items)
          const pendingForMyItems = response.data.filter(
            (req) => req.owner_id === session.user?.id && req.status === 'pending'
          );
          setPendingCount(pendingForMyItems.length);
        }
      } catch (err) {
        console.error('Error fetching pending requests count:', err);
        setPendingCount(0);
      }
    };

    fetchPendingCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    
    // Refresh count when window gains focus (user returns to tab)
    const handleFocus = () => {
      fetchPendingCount();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <nav className="bg-umass-maroon text-umass-cream p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          {logoError ? (
            <span className="text-xl font-bold text-umass-cream">🏛️ UMass Lends</span>
          ) : (
            <>
              <img 
                src="/umasslendslogo.png" 
                alt="UMass Lends Logo" 
                className="h-14 w-auto"
                onError={() => setLogoError(true)}
              />
              <span className="text-xl font-bold text-umass-cream hidden sm:inline-block">
                UMass Lends
              </span>
            </>
          )}
        </Link>
        
        <div className="flex gap-6 items-center">
          <Link to="/" className="hover:text-umass-lightCream transition-colors font-medium">
            Browse
          </Link>
          
          {session ? (
            <>
              <Link to="/my-items" className="hover:text-umass-lightCream transition-colors font-medium">
                My Items
              </Link>
              <Link to="/borrow-requests" className="hover:text-umass-lightCream transition-colors font-medium relative px-2 py-1">
                Requests
                {pendingCount > 0 && (
                  <span className="absolute top-2 right-0 bg-red-600 text-white text-xs font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center shadow-md transform translate-x-1/2 -translate-y-1/2" style={{ fontSize: '9px', lineHeight: '1', minWidth: '14px', padding: '0 2px' }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
              <Link to="/my-requests" className="hover:text-umass-lightCream transition-colors font-medium">
                My Requests
              </Link>
              <Link to="/available-requests" className="hover:text-umass-lightCream transition-colors font-medium">
                Available Requests
              </Link>
              <Link to="/items/new" className="hover:text-umass-lightCream transition-colors font-medium">
                List Item
              </Link>
              <Link to="/dashboard" className="hover:text-umass-lightCream transition-colors font-medium">
                Dashboard
              </Link>
              <Link to="/profile" className="hover:text-umass-lightCream transition-colors font-medium">
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="hover:text-umass-lightCream transition-colors font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-3 items-center">
              <Link to="/signin" className="hover:text-umass-lightCream transition-colors font-medium">
                Sign In
              </Link>
              <Link to="/signup" className="bg-umass-lightCream text-umass-maroon px-4 py-2 rounded-lg hover:bg-umass-cream transition-colors font-medium">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

