import { NextResponse } from 'next/server';

/**
 * Root page for the UMass Lends API
 * This is a backend-only Next.js deployment
 */
export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
        UMass Lends API
      </h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
        Backend API Server
      </p>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '600px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Available Endpoints</h2>
        <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
          <li style={{ marginBottom: '0.5rem' }}>📦 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>/api/items</code> - Items management</li>
          <li style={{ marginBottom: '0.5rem' }}>💬 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>/api/messages</code> - Messaging</li>
          <li style={{ marginBottom: '0.5rem' }}>📋 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>/api/item-requests</code> - Item requests</li>
          <li style={{ marginBottom: '0.5rem' }}>👤 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>/api/profile</code> - User profiles</li>
          <li style={{ marginBottom: '0.5rem' }}>🔍 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>/api/recommendations</code> - AI recommendations</li>
          <li style={{ marginBottom: '0.5rem' }}>🔐 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>/api/borrow</code> - Borrowing system</li>
        </ul>
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
          The frontend is a separate Vite application. API endpoints are available at <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>/api/*</code>
        </p>
      </div>
    </div>
  );
}

