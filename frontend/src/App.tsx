import React, { useState, useEffect } from 'react';
import './index.css';
import type { UserData, Exam, Result } from './types';
import { TakeExam } from './TakeExam';
import { AdminPanel } from './AdminPanel';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Student');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  // Dashboard Data
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  
  // Navigation State
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [viewResultDetail, setViewResultDetail] = useState<Result | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardExamTitle, setLeaderboardExamTitle] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCertificate, setShowCertificate] = useState<{examTitle: string; score: number; total: number} | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const addToast = (msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setUser(parsedUser);
        fetchDashboardData(token, parsedUser);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const fetchDashboardData = async (token: string, u: UserData) => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const response = await fetch(`${API_URL}/api/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setExams(await response.json());
      }
      if (u.role === 'Student' && u.id) {
        const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
        const resResp = await fetch(`${API_URL}/api/exams/results/${u.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resResp.ok) {
          setResults(await resResp.json());
        }
      }
    } catch (err) {
      addToast("Failed to fetch dashboard data.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setMessage('');
    addToast("Session ended successfully.");
    setActiveExamId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin ? { email, password } : { email, password, fullName, role };

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          const userData = { email, role: data.role, id: data.id };
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          setIsLoggedIn(true);
          fetchDashboardData(data.token, userData);
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

  const handleExamStateUpdate = async (examId: string, action: string) => {
    const token = localStorage.getItem('token');
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const res = await fetch(`${API_URL}/api/exams/${examId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        addToast(`Exam state changed to ${action}`);
        fetchDashboardData(token!, user!);
      }
    } catch (e) {
      addToast("Failed to update status.");
    }
  };

  const fetchLeaderboard = async (examId: string, title: string) => {
    const token = localStorage.getItem('token');
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const res = await fetch(`${API_URL}/api/exams/${examId}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLeaderboard(await res.json());
        setLeaderboardExamTitle(title);
        setShowLeaderboard(true);
      }
    } catch (e) {
      addToast("Failed to fetch leaderboard.");
    }
  };

  const printCertificate = () => {
    const certEl = document.getElementById('certificate-content');
    if (!certEl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Examiq Certificate</title><style>
      body { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#0d1117; font-family:'Georgia',serif; }
      .cert { border: 8px double #fba918; padding: 60px 80px; text-align:center; background:linear-gradient(135deg,#161b22,#0d1117); color:white; max-width:700px; border-radius:12px; }
      .cert h1 { font-size:2.5rem; color:#fba918; margin-bottom:10px; }
      .cert h2 { font-size:1.5rem; font-weight:normal; margin:0; color:#8b949e; }
      .cert .name { font-size:2rem; color:#58a6ff; margin:30px 0; }
      .cert .detail { font-size:1rem; color:#e6edf3; }
      .cert .id { font-size:0.8rem; color:#8b949e; margin-top:30px; }
      @media print { body { background:white; } .cert { border-color:#333; background:white; color:black; } .cert h1 { color:#b8860b; } .cert .name { color:#1a56db; } .cert .detail { color:#333; } }
    </style></head><body>${certEl.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  // Components
  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );

  if (isLoggedIn && user) {
    // If user is actively taking an exam
    if (activeExamId) {
      return (
        <div className="dashboard-container">
          <ToastContainer />
          <TakeExam 
            examId={activeExamId}
            token={localStorage.getItem('token')!}
            userId={user.id!}
            onClose={() => setActiveExamId(null)}
            addToast={addToast}
            onSubmitted={(score, status, total) => {
              addToast(`Exam Submitted! You scored ${score}/${total} (${status})`);
              setActiveExamId(null);
              fetchDashboardData(localStorage.getItem('token')!, user);
            }}
          />
        </div>
      );
    }

    // Main Dashboard
    return (
      <div className="dashboard-container">
        <ToastContainer />
        
        <header className="nav-header">
          <h2>Examiq Workspace</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.email} ({user.role})</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main>
          <h1 style={{ textAlign: 'left', marginBottom: '40px' }}>Welcome back, {user.role}.</h1>
          
          {user.role === 'Student' && results.length > 0 && (() => {
            const safePct = (s: number, t: number) => t > 0 ? (Number(s) / Number(t)) * 100 : 0;
            const avgPct = results.reduce((acc, curr) => acc + safePct(curr.score, curr.totalMarks), 0) / results.length;
            const passCount = results.filter(r => r.status === 'Pass').length;
            const passRate = Math.round((passCount / results.length) * 100);
            const highestPct = Math.round(Math.max(...results.map(r => safePct(r.score, r.totalMarks))));
            const recentResults = results.slice(-6);
            const circumference = 2 * Math.PI * 54;
            const passOffset = circumference - (passRate / 100) * circumference;

            return (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ textAlign: 'left', marginBottom: '20px' }}>📊 Performance Analytics</h2>

                {/* Stat Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 8px 0' }}>Total Exams</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#58a6ff' }}>{results.length}</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 8px 0' }}>Average Score</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: avgPct >= 40 ? '#7ee787' : '#ff7b72' }}>{avgPct.toFixed(1)}%</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 8px 0' }}>Highest Score</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#fba918' }}>{highestPct}%</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 8px 0' }}>Pass Rate</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: passRate >= 50 ? '#7ee787' : '#ff7b72' }}>{passRate}%</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  
                  {/* Bar Chart */}
                  <div className="glass-panel" style={{ padding: '25px' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>Recent Assessment Scores</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '180px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                      {recentResults.map((r, i) => {
                        const pct = Math.round(safePct(r.score, r.totalMarks));
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: pct >= 40 ? '#7ee787' : '#ff7b72' }}>{pct}%</span>
                            <div style={{ 
                              width: '100%', 
                              height: `${Math.max(pct, 5)}%`, 
                              background: `linear-gradient(180deg, ${pct >= 80 ? '#fba918' : (pct >= 40 ? '#238636' : '#da3633')} 0%, ${pct >= 80 ? '#b8860b' : (pct >= 40 ? '#155d27' : '#8b2020')} 100%)`, 
                              borderRadius: '6px 6px 2px 2px', 
                              transition: 'height 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: pct >= 80 ? '0 0 12px rgba(251,169,24,0.3)' : 'none',
                              minHeight: '8px'
                            }}></div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      {recentResults.map((r, i) => {
                        const examTitle = typeof r.examId === 'string' ? `#${i+1}` : ((r.examId as any)?.title?.substring(0, 8) || `#${i+1}`);
                        return <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{examTitle}</span>;
                      })}
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '15px', textAlign: 'center' }}>Last {recentResults.length} assessments</p>
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>Pass Rate</h3>
                    <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                      <svg width="130" height="130" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle 
                          cx="60" cy="60" r="54" fill="none" 
                          stroke={passRate >= 70 ? '#7ee787' : (passRate >= 40 ? '#fba918' : '#ff7b72')}
                          strokeWidth="10" 
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={passOffset}
                          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: passRate >= 70 ? '#7ee787' : (passRate >= 40 ? '#fba918' : '#ff7b72') }}>{passRate}%</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '15px' }}>{passCount} of {results.length} passed</p>

                    {/* Score Distribution Mini */}
                    <div style={{ width: '100%', marginTop: '20px', display: 'flex', gap: '4px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ flex: passCount, background: '#7ee787', transition: 'flex 1s' }}></div>
                      <div style={{ flex: results.length - passCount, background: '#ff7b72', transition: 'flex 1s' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '5px', fontSize: '0.7rem', opacity: 0.5 }}>
                      <span>Pass ({passCount})</span>
                      <span>Fail ({results.length - passCount})</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <h2 style={{ textAlign: 'left', marginBottom: '20px' }}>Assessments Hub</h2>
          <div className="grid-layout">
            {exams.length === 0 && <p style={{ opacity: 0.5 }}>No assessments available.</p>}
            {exams.map(exam => {
              const result = results.find(r => {
                if (!r.examId) return false;
                return typeof r.examId === 'string' ? r.examId === exam._id : (r.examId as any)._id === exam._id;
              });
              return (
                <div key={exam._id} className="glass-panel card">
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="badge">{exam.state}</div>
                    {exam.isPractice && <span className="badge" style={{ background: 'rgba(235, 100, 32, 0.2)', color: '#fba918' }}>PRACTICE</span>}
                  </div>
                  <h3 style={{ marginTop: '15px' }}>{exam.title}</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Assessment duration: {exam.duration} minutes.</p>
                  {exam.startTime && <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: '5px 0' }}>Starts: {new Date(exam.startTime).toLocaleString()}</p>}
                  {exam.endTime && <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: '5px 0 10px 0' }}>Ends: {new Date(exam.endTime).toLocaleString()}</p>}
                  
                  {result && (
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      <p style={{ margin: 0 }}>Score: {result.score} / {result.totalMarks}</p>
                      <p style={{ margin: 0, color: result.status === 'Pass' ? '#7ee787' : '#ff7b72' }}>Status: {result.status}</p>
                    </div>
                  )}

                  <div className="card-footer" style={{ flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ alignSelf: 'center' }}>State: {exam.state}</span>
                    
                    {(() => {
                      const now = Date.now();
                      let isWithinSchedule = true;
                      if (exam.startTime && now < new Date(exam.startTime).getTime()) isWithinSchedule = false;
                      if (exam.endTime && now > new Date(exam.endTime).getTime()) isWithinSchedule = false;
                      const canStart = exam.state === 'ACTIVE' && isWithinSchedule;

                      return (
                        <>
                          {user.role === 'Student' && !result && canStart && (
                            <button style={{ width: 'auto', marginTop: 0, padding: '8px 16px', borderRadius: '6px' }} onClick={() => setActiveExamId(exam._id)}>
                              Start Exam
                            </button>
                          )}
                          
                          {user.role === 'Student' && !result && !canStart && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                              <button style={{ width: 'auto', padding: '8px 16px', borderRadius: '6px' }} disabled>
                                Unavailable
                              </button>
                              {exam.startTime && exam.state === 'PUBLISHED' && new Date(exam.startTime).getTime() > currentTime && (
                                <span style={{ fontSize: '0.85rem', color: '#58a6ff', background: 'rgba(56, 139, 253, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                                  Starts in {Math.floor((new Date(exam.startTime).getTime() - currentTime) / 3600000)}h {Math.floor(((new Date(exam.startTime).getTime() - currentTime) % 3600000) / 60000)}m
                                </span>
                              )}
                            </div>
                          )}

                          {user.role === 'Student' && result && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button onClick={() => setViewResultDetail(result)} style={{ width: 'auto', padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>
                                View Analysis
                              </button>
                              <button onClick={() => fetchLeaderboard(exam._id, exam.title)} style={{ width: 'auto', padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(88,166,255,0.3)', color: '#58a6ff' }}>
                                Leaderboard
                              </button>
                              {result.status === 'Pass' && (result.score / result.totalMarks) >= 0.8 && (
                                <button onClick={() => setShowCertificate({ examTitle: exam.title, score: result.score, total: result.totalMarks })} style={{ width: 'auto', padding: '8px 16px', borderRadius: '6px', background: 'rgba(251,169,24,0.15)', border: '1px solid rgba(251,169,24,0.3)', color: '#fba918' }}>
                                  🏆 Claim Certificate
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {(user.role === 'Admin' || user.role === 'Examiner') && (
                       <div style={{ display: 'flex', gap: '10px' }}>
                         {exam.state === 'DRAFT' && <button onClick={() => handleExamStateUpdate(exam._id, 'publish')} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Publish</button>}
                         {exam.state === 'PUBLISHED' && <button onClick={() => handleExamStateUpdate(exam._id, 'activate')} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Activate</button>}
                         {exam.state === 'ACTIVE' && <button onClick={() => handleExamStateUpdate(exam._id, 'close')} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Close</button>}
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(user.role === 'Admin' || user.role === 'Examiner') && (
            <AdminPanel token={localStorage.getItem('token')!} role={user.role} addToast={addToast} refreshExams={() => fetchDashboardData(localStorage.getItem('token')!, user)} />
          )}

          {viewResultDetail && (
            <div className="modal-overlay" onClick={() => setViewResultDetail(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '30px', textAlign: 'left' }}>
                <h2 style={{ marginBottom: '20px' }}>Detailed Question Analysis</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {viewResultDetail.answersDetail?.map((ans, idx) => (
                    <div key={idx} style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: ans.isCorrect ? '4px solid #7ee787' : '4px solid #ff7b72' }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Q: {ans.content}</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: ans.isCorrect ? '#7ee787' : '#ff7b72' }}>Your Answer: {ans.userAnswer !== undefined ? String(ans.userAnswer) : 'Skipped'}</p>
                      {!ans.isCorrect && ans.correctAnswer !== undefined && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Correct Answer Index: {String(ans.correctAnswer)}</p>
                      )}
                    </div>
                  ))}
                  {(!viewResultDetail.answersDetail || viewResultDetail.answersDetail.length === 0) && (
                    <p style={{ opacity: 0.5 }}>No detailed analysis available for this legacy result.</p>
                  )}
                </div>
                <button onClick={() => setViewResultDetail(null)} style={{ marginTop: '20px', width: '100%' }}>Close Details</button>
              </div>
            </div>
          )}

          {showLeaderboard && (
            <div className="modal-overlay" onClick={() => setShowLeaderboard(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', padding: '30px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '5px' }}>🏅 Leaderboard</h2>
                <p style={{ opacity: 0.6, marginBottom: '20px' }}>{leaderboardExamTitle}</p>
                {leaderboard.length === 0 && <p style={{ opacity: 0.5 }}>No results yet.</p>}
                {leaderboard.map((entry: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: idx < 3 ? 'rgba(251,169,24,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', borderLeft: idx === 0 ? '4px solid #fba918' : (idx === 1 ? '4px solid #c0c0c0' : (idx === 2 ? '4px solid #cd7f32' : '4px solid transparent')) }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: idx === 0 ? '#fba918' : (idx === 1 ? '#c0c0c0' : (idx === 2 ? '#cd7f32' : 'white')) }}>#{idx + 1}</span>
                      <span style={{ color: '#e6edf3' }}>{entry.studentId?.fullName || entry.studentId?.email || 'Anonymous'}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#7ee787' }}>{entry.score}/{entry.totalMarks}</span>
                  </div>
                ))}
                <button onClick={() => setShowLeaderboard(false)} style={{ marginTop: '15px', width: '100%' }}>Close</button>
              </div>
            </div>
          )}

          {showCertificate && (
            <div className="modal-overlay" onClick={() => setShowCertificate(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <div id="certificate-content">
                  <div className="cert" style={{ border: '8px double #fba918', padding: '60px 80px', textAlign: 'center', background: 'linear-gradient(135deg,#161b22,#0d1117)', color: 'white', maxWidth: '700px', borderRadius: '12px' }}>
                    <h1 style={{ fontSize: '2.5rem', color: '#fba918', marginBottom: '10px' }}>Certificate of Excellence</h1>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'normal', margin: 0, color: '#8b949e' }}>Examiq Assessment Platform</h2>
                    <p style={{ fontSize: '2rem', color: '#58a6ff', margin: '30px 0' }}>{user.email}</p>
                    <p style={{ fontSize: '1rem', color: '#e6edf3' }}>Has successfully completed the assessment</p>
                    <p style={{ fontSize: '1.3rem', color: '#fba918', margin: '10px 0' }}>"{showCertificate.examTitle}"</p>
                    <p style={{ fontSize: '1rem', color: '#e6edf3' }}>with a score of <strong>{showCertificate.score}/{showCertificate.total}</strong> ({Math.round((showCertificate.score / showCertificate.total) * 100)}%)</p>
                    <p style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '30px' }}>Certificate ID: EXQ-{Date.now().toString(36).toUpperCase()} | Issued: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button onClick={printCertificate} style={{ width: 'auto', padding: '10px 30px', background: '#fba918', color: 'black', fontWeight: 'bold' }}>🖨️ Print / Save PDF</button>
                  <button onClick={() => setShowCertificate(null)} style={{ width: 'auto', padding: '10px 30px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Close</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Auth Layout
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
            <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          )}
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {!isLogin && (
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Student">Student Access</option>
              <option value="Examiner">Examiner Workspace</option>
              <option value="Admin">System Administrator</option>
            </select>
          )}
          
          <button type="submit">{isLogin ? 'Authenticate' : 'Register Now'}</button>
        </form>
        
        <p style={{ marginTop: '20px', fontSize: '0.9rem', cursor: 'pointer', color: '#8b949e' }} onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </p>
      </div>
    </div>
  )
}

export default App;
