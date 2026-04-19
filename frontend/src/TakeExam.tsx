import React, { useState, useEffect } from 'react';
import type { Exam, Question } from './types';

interface TakeExamProps {
  examId: string;
  token: string;
  userId: string;
  onClose: () => void;
  onSubmitted: (score: number, status: string, total: number) => void;
  addToast: (msg: string) => void;
}

export const TakeExam: React.FC<TakeExamProps> = ({ examId, token, userId, onClose, onSubmitted, addToast }) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [verificationFeedback, setVerificationFeedback] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    fetchExam();
    
    // Auto-load drafts
    const draft = localStorage.getItem(`exam_draft_${examId}_${userId}`);
    if (draft) {
      try { setAnswers(JSON.parse(draft)); } catch(e) {}
    }
  }, [examId]);

  // Auto-Save
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_draft_${examId}_${userId}`, JSON.stringify(answers));
    }
  }, [answers]);

  // Proctoring
  useEffect(() => {
    const handleBlur = () => {
      setTabSwitchCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
           addToast("Exam terminated due to tab switching violations.");
           handleSubmit();
        } else {
           addToast(`WARNING: Tab switch detected! Your exam will auto-submit after 3 violations. (${next}/3)`);
        }
        return next;
      });
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !isSubmitting) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev! - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isSubmitting) {
      addToast('Time is up! Auto-submitting...');
      handleSubmit();
    }
  }, [timeLeft, isSubmitting]);

  const fetchExam = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/exams/${examId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExam(data);
        setTimeLeft(data.duration * 60);
      } else {
        addToast("Failed to fetch exam details.");
      }
    } catch (err) {
      addToast("Network error fetching exam.");
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Clear feedback if they change their answer
    setVerificationFeedback(prev => ({...prev, [questionId]: null}));
  };

  const handleVerify = (q: any) => {
    const userA = answers[q._id!];
    if (userA === undefined) return;
    let isCorrect = false;
    if (q.type === 'MCQ') isCorrect = userA === q.metadata?.correctOptionIndex;
    if (q.type === 'TF') isCorrect = userA === q.metadata?.correctAnswer;
    setVerificationFeedback(prev => ({ ...prev, [q._id!]: isCorrect }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/exams/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ examId, studentId: userId, answers })
      });
      if (response.ok) {
        // Clear draft on successful submit
        localStorage.removeItem(`exam_draft_${examId}_${userId}`);
        const result = await response.json();
        onSubmitted(result.score, result.status, result.totalMarks);
      } else {
        addToast("Submission failed.");
        setIsSubmitting(false);
      }
    } catch (err) {
      addToast("Network error during submission.");
      setIsSubmitting(false);
    }
  };

  if (!exam) return <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>Loading Exam...</div>;

  const m = Math.floor((timeLeft || 0) / 60);
  const s = (timeLeft || 0) % 60;
  
  const q = exam.questions && exam.questions.length > 0 ? exam.questions[currentIndex] : null;

  return (
    <div className="take-exam-container animate-in">
      {tabSwitchCount > 0 && tabSwitchCount < 3 && (
        <div style={{ background: '#ff7b72', color: 'black', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '8px', marginBottom: '15px' }}>
          PROCTOR WARNING: Do not leave the browser tab. Violation {tabSwitchCount}/3.
        </div>
      )}

      <header className="exam-header glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <h2>{exam.title} {exam.isPractice && <span className="badge" style={{ verticalAlign: 'middle', background: 'rgba(235, 100, 32, 0.2)', color: '#fba918' }}>PRACTICE MODE</span>}</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: timeLeft! < 60 ? '#ff7b72' : 'inherit' }}>
            Time Remaining: {m}:{s < 10 ? '0' : ''}{s}
          </span>
          <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', opacity: 0.7 }}>Cancel</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '30px', marginTop: '30px', alignItems: 'flex-start' }}>
        
        {/* Navigation Sidebar */}
        <div className="glass-panel" style={{ width: '250px', padding: '20px', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '15px' }}>Questions List</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {exam.questions?.map((question, idx) => {
              const isAnswered = answers[question._id!] !== undefined;
              const isActive = idx === currentIndex;
              return (
                <button 
                  key={idx} 
                  onClick={() => setCurrentIndex(idx)}
                  style={{ 
                    padding: '10px 0', 
                    borderRadius: '6px', 
                    background: isActive ? 'var(--primary)' : (isAnswered ? 'rgba(126, 231, 135, 0.2)' : 'rgba(255,255,255,0.05)'),
                    color: isActive ? 'white' : (isAnswered ? '#7ee787' : 'white'),
                    border: isActive ? '1px solid white' : '1px solid transparent'
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question View */}
        <div className="exam-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {q ? (
            <div key={q._id} className="glass-panel card animate-in" style={{ textAlign: 'left', padding: '30px' }}>
              <span className="badge">{q.difficulty} | {q.type}</span>
              <h3 style={{ marginTop: '15px', marginBottom: '20px' }}>{currentIndex + 1}. {q.content}</h3>
              
              <div>
                {q.type === 'MCQ' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(q.metadata?.options || q.options || []).map((opt: string, i: number) => (
                      <label key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '15px', background: answers[q._id!] === i ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '8px', transition: 'background 0.2s', border: answers[q._id!] === i ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent' }}>
                        <div style={{ display: 'flex', gap: '15px', color: '#e6edf3' }}>
                          <span style={{ fontWeight: 'bold', color: '#8b949e' }}>{String.fromCharCode(65 + i)}.</span>
                          <span style={{ flex: 1, wordBreak: 'break-word' }}>{opt}</span>
                        </div>
                        <input type="radio" name={`q-${q._id}`} value={i} checked={answers[q._id!] === i} onChange={() => handleAnswerChange(q._id!, i)} style={{ display: 'none' }} />
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'TF' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '15px', background: answers[q._id!] === true ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '8px', transition: 'background 0.2s', border: answers[q._id!] === true ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent' }}>
                      <div style={{ display: 'flex', gap: '15px', color: '#e6edf3' }}>
                        <span style={{ fontWeight: 'bold', color: '#8b949e' }}>A.</span><span>True</span>
                      </div>
                      <input type="radio" name={`q-${q._id}`} checked={answers[q._id!] === true} onChange={() => handleAnswerChange(q._id!, true)} style={{ display: 'none' }} />
                    </label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '15px', background: answers[q._id!] === false ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '8px', transition: 'background 0.2s', border: answers[q._id!] === false ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent' }}>
                      <div style={{ display: 'flex', gap: '15px', color: '#e6edf3' }}>
                        <span style={{ fontWeight: 'bold', color: '#8b949e' }}>B.</span><span>False</span>
                      </div>
                      <input type="radio" name={`q-${q._id}`} checked={answers[q._id!] === false} onChange={() => handleAnswerChange(q._id!, false)} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {q.type === 'Subjective' && (
                  <textarea 
                    rows={4}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    placeholder="Enter your answer here..."
                    value={answers[q._id!] || ''}
                    onChange={(e) => handleAnswerChange(q._id!, e.target.value)}
                  />
                )}
              </div>

              {exam.isPractice && answers[q._id!] !== undefined && q.type !== 'Subjective' && (
                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                   <button onClick={() => handleVerify(q)} style={{ width: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}>Verify Answer</button>
                   {verificationFeedback[q._id!] === true && <span style={{ color: '#7ee787', fontWeight: 'bold' }}>✓ Correct!</span>}
                   {verificationFeedback[q._id!] === false && <span style={{ color: '#ff7b72', fontWeight: 'bold' }}>✗ Incorrect.</span>}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} style={{ width: 'auto', padding: '8px 20px' }}>← Previous</button>
                <button disabled={currentIndex === (exam.questions?.length || 0) - 1} onClick={() => setCurrentIndex(prev => prev + 1)} style={{ width: 'auto', padding: '8px 20px' }}>Next →</button>
              </div>

            </div>
          ) : (
            <p style={{ opacity: 0.5 }}>This exam has no questions.</p>
          )}
        </div>
      </div>
    </div>
  );
};
