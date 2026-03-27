import React, { useState, useEffect } from 'react'
import './index.css'

interface UserData {
  email: string;
  role: string;
}

function Dashboard({ user, onLogout }: { user: UserData; onLogout: () => void }) {
  const dummyExams = [
    { id: 1, title: "Mid-term UI/UX Design", duration: "60 mins", status: "Active" },
    { id: 2, title: "Backend Systems Architecture", duration: "90 mins", status: "Upcoming" },
    { id: 3, title: "Advanced Mathematics III", duration: "45 mins", status: "Closed" },
  ];

  return (
    <div className="dashboard-container">
      <header className="nav-header">
        <h2>Examiq Workspace</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.email} ({user.role})</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main>
        <h1 style={{ textAlign: 'left', marginBottom: '40px' }}>Welcome back.</h1>
        
        <div className="grid-layout">
          {dummyExams.map(exam => (
            <div key={exam.id} className="glass-panel card">
              <div className="badge">{exam.status}</div>
              <h3 style={{ marginTop: '15px' }}>{exam.title}</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Assessment period for this module is currently {exam.status.toLowerCase()}.</p>
              
              <div className="card-footer">
                <span>Time: {exam.duration}</span>
                <button 
                  style={{ width: 'auto', marginTop: 0, padding: '8px 16px', borderRadius: '6px' }}
                  disabled={exam.status !== 'Active'}
                >
                  {exam.status === 'Active' ? 'Start Exam' : 'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setMessage('');
  };

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
        if (isLogin) {
          localStorage.setItem('token', data.token);
          const userData = { email, role: data.role || 'Student' };
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          setIsLoggedIn(true);
        } else {
          setMessage('Account created! Please login.');
          setIsLogin(true);
        }
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
  };

  if (isLoggedIn && user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1>{isLogin ? 'Examiq Portal' : 'Create Account'}</h1>
        <p style={{ marginBottom: '30px' }} className="pulse-animation">
          {isLogin ? 'Secure access to your assessments.' : 'Join the modern testing platform.'}
        </p>
        
        {message && <p style={{ color: message.includes('success') || message.includes('created') ? '#7ee787' : '#ff7b72', marginBottom: '15px' }}>{message}</p>}

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
    </div>
  )
}

export default App
