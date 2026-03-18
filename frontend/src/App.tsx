import { useState } from 'react'
import './index.css'

function App() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
      <h1>{isLogin ? 'Examiq Portal' : 'Create Account'}</h1>
      <p style={{ marginBottom: '30px' }} className="pulse-animation">
        {isLogin ? 'Secure access to your assessments.' : 'Join the modern testing platform.'}
      </p>
      
      <form onSubmit={(e) => e.preventDefault()}>
        {!isLogin && (
          <input type="text" placeholder="Full Name" required />
        )}
        <input type="email" placeholder="Email Address" required />
        <input type="password" placeholder="Password" required />
        
        <button type="submit">
          {isLogin ? 'Authenticate' : 'Register Now'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px', fontSize: '0.9rem', cursor: 'pointer', color: '#8b949e' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
      </p>
    </div>
  )
}

export default App
