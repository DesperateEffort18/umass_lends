/**
 * Example: How to get token from AuthContext
 * Add this to any component that uses AuthContext
 */

import { UserAuth } from '../context/AuthContext';

function TokenDisplay() {
  const { session } = UserAuth();

  const getToken = () => {
    if (session?.access_token) {
      console.log('Access Token:', session.access_token);
      // Copy to clipboard
      navigator.clipboard.writeText(session.access_token);
      alert('Token copied to clipboard!');
      return session.access_token;
    } else {
      console.log('No session found. Please sign in.');
      return null;
    }
  };

  return (
    <div>
      <button onClick={getToken}>Get My Access Token</button>
      {session && (
        <div>
          <p>Signed in as: {session.user.email}</p>
          <p>Token: {session.access_token?.substring(0, 20)}...</p>
        </div>
      )}
    </div>
  );
}

export default TokenDisplay;

