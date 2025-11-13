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
    <nav className="relative bg-gradient-maroon text-umass-cream shadow-lg border-b-2 border-umass-maroonDark">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
           style={{
             backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)'
           }}></div>
      
      <div className="container mx-auto px-6 py-4 relative z-10">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-4 hover:opacity-90 transition-all duration-300 group">
            {logoError ? (
              <span className="text-2xl font-display font-bold text-umass-cream tracking-tight">
                🏛️ UMass Lends
              </span>
            ) : (
              <>
                <img 
                  src="/umasslendslogo.png" 
                  alt="UMass Lends Logo" 
                  className="h-16 w-auto transition-transform duration-300 group-hover:scale-105"
                  onError={() => setLogoError(true)}
                />
                <span className="text-2xl font-display font-bold text-umass-cream hidden sm:inline-block tracking-tight">
                  UMass Lends
                </span>
              </>
            )}
          </Link>
          
          <div className="flex gap-8 items-center">
            <Link 
              to="/" 
              className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 relative group"
            >
              Browse
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-umass-lightCream transition-all duration-300 group-hover:w-full"></span>
            </Link>
            
            {session ? (
              <>
                <Link 
                  to="/my-items" 
                  className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 relative group"
                >
                  My Items
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-umass-lightCream transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/borrow-requests" 
                  className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 relative px-3 py-1 group"
                >
                  Requests
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg transform scale-100 group-hover:scale-110 transition-transform duration-200" style={{ fontSize: '10px', lineHeight: '1', minWidth: '20px', padding: '0 3px' }}>
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-umass-lightCream transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/custom-requests" 
                  className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 relative group"
                >
                  Custom Requests
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-umass-lightCream transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/dashboard" 
                  className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 relative group"
                >
                  Dashboard
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-umass-lightCream transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/profile" 
                  className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 relative group"
                >
                  Profile
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-umass-lightCream transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 px-4 py-2 border-2 border-umass-cream/30 hover:border-umass-cream rounded-md transition-all duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-4 items-center">
                <Link 
                  to="/signin" 
                  className="font-accent font-semibold text-sm uppercase tracking-wider hover:text-umass-lightCream transition-colors duration-200 relative group"
                >
                  Sign In
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-umass-lightCream transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-umass-lightCream text-umass-maroon px-5 py-2.5 rounded-md hover:bg-white transition-all duration-300 font-accent font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

