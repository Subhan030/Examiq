import { useState } from 'react'
import './index.css'

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin ? { email, password } : { email, password, role: 'Student' };

    try {
      const response = await fetch(`http://localhost:4000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`${isLogin ? 'Login' : 'Registration'} successful!`);
        if (isLogin && data.token) {
          localStorage.setItem('token', data.token);
        }
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
      <h1>{isLogin ? 'Examiq Portal' : 'Create Account'}</h1>
      <p style={{ marginBottom: '30px' }} className="pulse-animation">
        {isLogin ? 'Secure access to your assessments.' : 'Join the modern testing platform.'}
      </p>
      
      {message && <p style={{ color: message.includes('successful') ? '#7ee787' : '#ff7b72', marginBottom: '15px' }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input 
            type="text" 
            placeholder="Full Name" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
          />
        )}
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        
        <button type="submit">
          {isLogin ? 'Authenticate' : 'Register Now'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px', fontSize: '0.9rem', cursor: 'pointer', color: '#8b949e' }} onClick={() => {
        setIsLogin(!isLogin);
        setMessage('');
      }}>
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
      </p>
    </div>
  )
}

export default App
