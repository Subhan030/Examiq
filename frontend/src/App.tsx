import React, { useState, useEffect } from 'react'
import './index.css'

interface UserData {
  email: string;
  role: string;
  id?: string;
}

interface Exam {
  _id: string;
  title: string;
  duration: number;
  state: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED';
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', duration: 60, state: 'DRAFT' as const });

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
      fetchExams(token);
    }
  }, []);

  const fetchExams = async (token: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (err) {
      addToast("Failed to fetch live exam data.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setMessage('');
    addToast("Session ended successfully.");
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    // Simplified: Using a hardcoded courseId for demonstration
    // In a full app, you'd pick a course from a dropdown
    const courseId = "60eaf2960eaf2960eaf2960e"; 
    
    try {
      const response = await fetch('http://localhost:4000/api/exams', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newExam, courseId, totalMarks: 100 })
      });

      if (response.ok) {
        const created = await response.json();
        setExams(prev => [...prev, created]);
        setIsModalOpen(false);
        addToast(`Exam "${newExam.title}" deployed!`);
      } else {
        addToast("Authorization failed for this action.");
      }
    } catch (err) {
      addToast("Network error during deployment.");
    }
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
          fetchExams(data.token);
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
          <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Duration (min)</label>
          <input 
            type="number" 
            value={newExam.duration} 
            onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value)})} 
            required 
          />
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
            {exams.length === 0 && <p style={{ opacity: 0.5 }}>No assessments assigned to your account yet.</p>}
            {exams.map(exam => (
              <div key={exam._id} className="glass-panel card">
                <div className="badge">{exam.state}</div>
                <h3 style={{ marginTop: '15px' }}>{exam.title}</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Assessment duration: {exam.duration} minutes.</p>
                
                <div className="card-footer">
                  <span>Status: {exam.state}</span>
                  <button 
                    style={{ width: 'auto', marginTop: 0, padding: '8px 16px', borderRadius: '6px' }}
                    disabled={exam.state !== 'ACTIVE'}
                    onClick={() => addToast(`Starting session for "${exam.title}"...`)}
                  >
                    {exam.state === 'ACTIVE' ? 'Start Exam' : 'Preview'}
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
                  <button className="admin-btn" onClick={() => addToast("User management online.")}>Manage Users</button>
                </div>
                <div className="glass-panel card">
                  <h3>Global Audit</h3>
                  <p style={{ fontSize: '0.85rem' }}>Real-time analytics on platform usage and grade distributions.</p>
                  <button className="admin-btn" onClick={() => addToast("Fetching platform audits...")}>Generate Reports</button>
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
