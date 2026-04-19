import React, { useState, useEffect } from 'react';
import type { Course, Exam, Question } from './types';

interface AdminPanelProps {
  token: string;
  role: string;
  addToast: (msg: string) => void;
  refreshExams: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ token, role, addToast, refreshExams }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  
  // Exam Creation State
  const [newExam, setNewExam] = useState({ title: '', courseId: '', duration: 60, totalMarks: 100, startTime: '', endTime: '', isPractice: false, randomizeCount: 0 });
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Grading State
  const [allResults, setAllResults] = useState<any[]>([]);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const resp = await fetch(`${API_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        setCourses(await resp.json());
      }
    } catch (e) {
      addToast("Failed to fetch courses.");
    }
  };

  const fetchAllResults = async () => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const resp = await fetch(`${API_URL}/api/exams/results/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) setAllResults(await resp.json());
    } catch (e) {
      addToast("Failed to fetch submissions.");
    }
  };

  const handleGrade = async (resultId: string, questionId: string, scoreDelta: number) => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const resp = await fetch(`${API_URL}/api/exams/results/${resultId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ questionId, scoreDelta })
      });
      if (resp.ok) {
        addToast('Grade updated successfully!');
        fetchAllResults();
      }
    } catch (e) {
      addToast('Grading failed.');
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) { addToast('Invalid JSON format. Expected an array.'); return; }
        const mapped: Question[] = parsed.map((q: any) => ({
          type: q.type || 'MCQ',
          category: q.category || 'General',
          difficulty: q.difficulty || 'Medium',
          content: q.content || '',
          options: q.options || ['', '', '', ''],
          correctOptionIndex: q.correctOptionIndex || 0,
          correctAnswer: q.correctAnswer,
          expectedKeywords: q.expectedKeywords
        }));
        setQuestions(prev => [...prev, ...mapped]);
        addToast(`${mapped.length} questions imported successfully!`);
      } catch (err) {
        addToast('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Assuming instructorId will be taken from token payload on backend, or we pass a dummy if missing
      // We didn't change courseController to infer instructor from token, so let's check backend.
      // Wait, in Course model instructorId is required. Backend courseController line 8: const { title, description, instructorId } = req.body;
      // We must pass instructorId. But in UI we don't have user ID directly here unless passed as prop. 
      // Let's pass userId as a prop or decode token. For simplicity, we can fetch userId from local storage or decode token here.
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const resp = await fetch(`${API_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newCourse, instructorId: user.id })
      });
      if (resp.ok) {
        addToast("Course created successfully!");
        setIsCourseModalOpen(false);
        fetchCourses();
      } else {
        addToast("Failed to create course.");
      }
    } catch (e) {
      addToast("Network Error.");
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map frontend config to backend metadata
    const parsedQuestions = questions.map(q => {
      let metadata: any = {};
      if (q.type === 'MCQ') {
        metadata = { options: q.options, correctOptionIndex: q.correctOptionIndex };
      } else if (q.type === 'TF') {
        metadata = { correctAnswer: q.correctAnswer };
      } else if (q.type === 'Subjective') {
        metadata = { expectedKeywords: q.expectedKeywords };
      }
      return {
        type: q.type,
        category: q.category,
        difficulty: q.difficulty,
        content: q.content,
        metadata
      };
    });

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const resp = await fetch(`${API_URL}/api/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newExam, questions: parsedQuestions })
      });
      if (resp.ok) {
        addToast("Exam created successfully!");
        setIsExamModalOpen(false);
        setQuestions([]);
        refreshExams();
      } else {
        addToast("Failed to create exam.");
      }
    } catch (e) {
      addToast("Network Error.");
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: 'MCQ', category: 'General', difficulty: 'Medium', content: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  return (
    <div className="admin-panel animate-in">
      <h2 style={{ textAlign: 'left' }}>Administrative Tools</h2>
      <div className="admin-grid">
        <div className="glass-panel card">
          <h3>Exam Hub</h3>
          <p style={{ fontSize: '0.85rem' }}>Create, schedule, and finalize assessments.</p>
          <button className="admin-btn" onClick={() => {
            if (courses.length === 0) {
              addToast("Please create a course first.");
              return;
            }
            setNewExam({ ...newExam, courseId: courses[0]._id });
            setIsExamModalOpen(true);
          }}>Create New Exam</button>
        </div>
        <div className="glass-panel card">
          <h3>Grading Portal</h3>
          <p style={{ fontSize: '0.85rem' }}>Review and manually grade subjective answers.</p>
          <button className="admin-btn" onClick={() => { fetchAllResults(); setIsGradingOpen(true); }}>Open Grading Console</button>
        </div>
      </div>




      {isExamModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExamModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Deploy New Exam</h2>
            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <select value={newExam.courseId} onChange={e => setNewExam({...newExam, courseId: e.target.value})}>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
              <input type="text" placeholder="Exam Title" required value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={newExam.duration} onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value)})}>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={90}>90 Minutes (1.5 Hours)</option>
                  <option value={120}>120 Minutes (2 Hours)</option>
                  <option value={180}>180 Minutes (3 Hours)</option>
                </select>
                <input type="number" placeholder="Total Marks" required value={newExam.totalMarks} onChange={e => setNewExam({...newExam, totalMarks: parseInt(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Schedule Start Time (Optional)</label>
                <input type="datetime-local" value={newExam.startTime} onChange={e => setNewExam({...newExam, startTime: e.target.value})} />
                <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Schedule End Time (Optional)</label>
                <input type="datetime-local" value={newExam.endTime} onChange={e => setNewExam({...newExam, endTime: e.target.value})} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newExam.isPractice} onChange={e => setNewExam({...newExam, isPractice: e.target.checked})} style={{ width: 'auto' }} />
                  Enable Practice Mode (Allows instant answer checking)
                </label>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Randomize Questions (0 = all, N = pick N randomly)</label>
                  <input type="number" min="0" value={newExam.randomizeCount} onChange={e => setNewExam({...newExam, randomizeCount: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                <h3 style={{ marginBottom: '10px' }}>Questions ({questions.length})</h3>
                {questions.map((q, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <select value={q.type} onChange={e => handleQuestionChange(idx, 'type', e.target.value)}>
                        <option value="MCQ">Multiple Choice</option>
                        <option value="TF">True/False</option>
                        <option value="Subjective">Subjective</option>
                      </select>
                      <select value={q.difficulty} onChange={e => handleQuestionChange(idx, 'difficulty', e.target.value)}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Question Content" required value={q.content} onChange={e => handleQuestionChange(idx, 'content', e.target.value)} style={{ marginBottom: '10px' }} />
                    
                    {q.type === 'MCQ' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {q.options?.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input type="radio" name={`correct-${idx}`} checked={q.correctOptionIndex === oIdx} onChange={() => handleQuestionChange(idx, 'correctOptionIndex', oIdx)} />
                            <input type="text" placeholder={`Option ${oIdx + 1}`} value={opt} onChange={e => {
                                const newOpts = [...q.options!];
                                newOpts[oIdx] = e.target.value;
                                handleQuestionChange(idx, 'options', newOpts);
                            }} />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.type === 'TF' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <label><input type="radio" name={`tf-correct-${idx}`} checked={q.correctAnswer === true} onChange={() => handleQuestionChange(idx, 'correctAnswer', true)} /> True</label>
                        <label><input type="radio" name={`tf-correct-${idx}`} checked={q.correctAnswer === false} onChange={() => handleQuestionChange(idx, 'correctAnswer', false)} /> False</label>
                      </div>
                    )}

                    {q.type === 'Subjective' && (
                      <input type="text" placeholder="Expected Keywords (comma separated)" value={(q.expectedKeywords || []).join(',')} onChange={e => handleQuestionChange(idx, 'expectedKeywords', e.target.value.split(','))} />
                    )}

                    <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== idx))} style={{ background: '#ff7b72', marginTop: '10px' }}>Remove</button>
                  </div>
                ))}
                <button type="button" onClick={addQuestion} className="primary-btn" style={{ background: '#238636', width: '100%' }}>+ Add Question</button>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginBottom: '5px' }}>Or import from JSON file:</label>
                  <input type="file" accept=".json" onChange={handleBulkUpload} style={{ fontSize: '0.85rem' }} />
                </div>
                
                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(88, 166, 255, 0.1)', border: '1px solid #58a6ff', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#58a6ff' }}>✨ Generate Questions with AI (Groq)</h4>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Topic (e.g. JavaScript Basics)" id="aiTopic" style={{ flex: 1, minWidth: '200px' }} />
                    <input type="number" min="1" max="20" defaultValue={5} id="aiCount" style={{ width: '80px' }} title="Number of questions" />
                    <select id="aiDifficulty">
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <button type="button" onClick={async (e) => {
                    const btn = e.currentTarget;
                    const topic = (document.getElementById('aiTopic') as HTMLInputElement).value;
                    const count = (document.getElementById('aiCount') as HTMLInputElement).value;
                    const difficulty = (document.getElementById('aiDifficulty') as HTMLSelectElement).value;
                    
                    if (!topic) {
                      addToast("Please enter a topic for AI generation.");
                      return;
                    }
                    
                    btn.innerText = 'Generating...';
                    btn.disabled = true;
                    
                    try {
                      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
                      const resp = await fetch(`${API_URL}/api/exams/generate-questions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ topic, count: parseInt(count), difficulty })
                      });
                      const data = await resp.json();
                      if (resp.ok) {
                        setQuestions(prev => [...prev, ...data]);
                        addToast(`${data.length} questions generated successfully!`);
                        (document.getElementById('aiTopic') as HTMLInputElement).value = '';
                      } else {
                        addToast(`AI Generation failed: ${data.message || 'Unknown error'}`);
                      }
                    } catch (err) {
                      addToast("Failed to connect to AI service.");
                    } finally {
                      btn.innerText = 'Generate AI Questions';
                      btn.disabled = false;
                    }
                  }} style={{ background: '#58a6ff', color: '#0d1117', width: '100%', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Generate AI Questions
                  </button>
                </div>
              </div>

              <button type="submit" style={{ marginTop: '20px' }}>Deploy to Portal</button>
              <button type="button" onClick={() => setIsExamModalOpen(false)} style={{ border: 'none', background: 'transparent' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {isGradingOpen && (
        <div className="modal-overlay" onClick={() => setIsGradingOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Subjective Grading Console</h2>
            {allResults.length === 0 && <p style={{ opacity: 0.5 }}>No submissions found.</p>}
            {allResults.map((result: any) => {
              const subjectiveAnswers = (result.answersDetail || []).filter((a: any) => !a.isCorrect && typeof a.userAnswer === 'string' && a.userAnswer.length > 10);
              if (subjectiveAnswers.length === 0) return null;
              return (
                <div key={result._id} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Student: {result.studentId?.fullName || result.studentId?.email || 'Unknown'} | Exam: {result.examId?.title || 'N/A'} | Current Score: {result.score}/{result.totalMarks}</p>
                  {subjectiveAnswers.map((ans: any, idx: number) => (
                    <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #fba918' }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Q: {ans.content}</p>
                      <p style={{ margin: '0 0 10px 0', color: '#e6edf3' }}>Answer: "{ans.userAnswer}"</p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleGrade(result._id, ans.questionId, 10)} style={{ width: 'auto', padding: '4px 12px', fontSize: '0.85rem', background: '#238636' }}>Award Full (10pts)</button>
                        <button onClick={() => handleGrade(result._id, ans.questionId, 5)} style={{ width: 'auto', padding: '4px 12px', fontSize: '0.85rem', background: '#58a6ff' }}>Partial (5pts)</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            <button onClick={() => setIsGradingOpen(false)} style={{ width: '100%', marginTop: '15px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
