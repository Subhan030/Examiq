import React, { useState, useEffect } from 'react'
import './index.css'

interface UserData {
  email: string;
  role: string;
}

interface Exam {
  id: number;
  title: string;
  duration: string;
  status: 'Active' | 'Upcoming' | 'Closed';
}

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Student');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  // New Interactive State
  const [exams, setExams] = useState<Exam[]>([
    { id: 1, title: "Mid-term UI/UX Design", duration: "60 mins", status: "Active" },
    { id: 2, title: "Backend Systems Architecture", duration: "90 mins", status: "Upcoming" },
    { id: 3, title: "Advanced Mathematics III", duration: "45 mins", status: "Closed" },
  ]);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', duration: '60 mins', status: 'Active' as const });

  const addToast = (msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

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
    addToast("Session ended successfully.");
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    const id = exams.length + 1;
    setExams(prev => [...prev, { id, ...newExam }]);
    setIsModalOpen(false);
    setNewExam({ title: '', duration: '60 mins', status: 'Active' });
    addToast(`Exam "${newExam.title}" deployed successfully!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin ? { email, password } : { email, password, fullName, role };

    try {
      const response = await fetch(`http://localhost:4000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Components
  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </div>
  );

  const CreateExamModal = () => (
    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '20px' }}>Deploy New Exam</h2>
        <form onSubmit={handleCreateExam}>
          <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Exam Title</label>
          <input 
            type="text" 
            placeholder="e.g. Final Assessment" 
            value={newExam.title} 
            onChange={e => setNewExam({...newExam, title: e.target.value})} 
            required 
          />
          <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Duration</label>
          <select value={newExam.duration} onChange={e => setNewExam({...newExam, duration: e.target.value})}>
            <option>30 mins</option>
            <option>45 mins</option>
            <option>60 mins</option>
            <option>90 mins</option>
            <option>120 mins</option>
          </select>
          <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Status</label>
          <select value={newExam.status} onChange={e => setNewExam({...newExam, status: e.target.value as any})}>
            <option value="Active">Active (Launch Immediately)</option>
            <option value="Upcoming">Upcoming (Scheduled)</option>
          </select>
          <button type="submit" style={{ marginTop: '30px' }}>Deploy to Portal</button>
          <button type="button" onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'transparent', opacity: 0.5, marginTop: '10px' }}>Cancel</button>
        </form>
      </div>
    </div>
  );

  if (isLoggedIn && user) {
    return (
      <div className="dashboard-container">
        <ToastContainer />
        {isModalOpen && <CreateExamModal />}
        
        <header className="nav-header">
          <h2>Examiq Workspace</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.email} ({user.role})</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main>
          <h1 style={{ textAlign: 'left', marginBottom: '40px' }}>Welcome back, {user.role}.</h1>
          
          <div className="grid-layout">
            {exams.map(exam => (
              <div key={exam.id} className="glass-panel card">
                <div className="badge">{exam.status}</div>
                <h3 style={{ marginTop: '15px' }}>{exam.title}</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Assessment period for this module is currently {exam.status.toLowerCase()}.</p>
                
                <div className="card-footer">
                  <span>Time: {exam.duration}</span>
                  <button 
                    style={{ width: 'auto', marginTop: 0, padding: '8px 16px', borderRadius: '6px' }}
                    disabled={exam.status !== 'Active'}
                    onClick={() => addToast(`Initializing secure environment for "${exam.title}"...`)}
                  >
                    {exam.status === 'Active' ? 'Start Exam' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {user.role === 'Admin' && (
            <div className="admin-panel animate-in">
              <h2 style={{ textAlign: 'left' }}>Administrative Tools</h2>
              <div className="admin-grid">
                <div className="glass-panel card">
                  <h3>Exam Hub</h3>
                  <p style={{ fontSize: '0.85rem' }}>Create, schedule, and finalize assessments across all courses.</p>
                  <button className="admin-btn" onClick={() => setIsModalOpen(true)}>Create New Exam</button>
                </div>
                <div className="glass-panel card">
                  <h3>Member Control</h3>
                  <p style={{ fontSize: '0.85rem' }}>Manage examiner assignments and verify student enrollments.</p>
                  <button className="admin-btn" onClick={() => addToast("User management system is initializing...")}>Manage Users</button>
                </div>
                <div className="glass-panel card">
                  <h3>Global Audit</h3>
                  <p style={{ fontSize: '0.85rem' }}>Real-time analytics on platform usage and grade distributions.</p>
                  <button className="admin-btn" onClick={() => addToast("Aggregating system reports...")}>Generate Reports</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <ToastContainer />
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

          {!isLogin && (
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Student">Student Access</option>
              <option value="Examiner">Examiner Workspace</option>
              <option value="Admin">System Administrator</option>
            </select>
          )}
          
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
