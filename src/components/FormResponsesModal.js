'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import ConfirmationModal from '@/components/ConfirmationModal';

const FormResponsesModal = ({ isOpen, onClose, formId, formTitle }) => {
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('summary');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, responseIdx: null, studentName: '' });
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (isOpen && formId) {
      fetchResponses();
    }
  }, [isOpen, formId]);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}`);
      if (res.ok) {
        const data = await res.json();
        setResponses(data.form.responses || []);
        setQuestions(data.form.questions || []);
      }
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (studentResponse) => {
    let earnedPoints = 0;
    let totalPoints = 0;

    questions.forEach(q => {
      const studentAnswer = studentResponse.answers.find(a => a.questionId === q.id)?.answer;
      totalPoints += (q.points || 0);

      if (studentAnswer !== undefined && studentAnswer !== null) {
        const isCorrect = checkAnswer(q, studentAnswer);
        if (isCorrect) {
          earnedPoints += (q.points || 0);
        }
      }
    });

    return { earnedPoints, totalPoints, percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0 };
  };

  const checkAnswer = (question, answer) => {
    const correct = question.correctAnswer;
    if (correct === null || correct === undefined) return false;

    if (question.type === 'checkboxes') {
      if (!Array.isArray(answer) || !Array.isArray(correct)) return false;
      return answer.length === correct.length && answer.every(val => correct.includes(val));
    }

    if (question.type === 'true_false') {
      return answer.toString().toLowerCase() === correct.toString().toLowerCase();
    }

    return answer.toString().trim().toLowerCase() === correct.toString().trim().toLowerCase();
  };

  const deleteResponse = async (responseIdx, e) => {
    e?.stopPropagation();
    const response = responses[responseIdx];
    setDeleteConfirm({
      isOpen: true,
      responseIdx,
      studentName: response.studentId?.name || 'this student'
    });
  };

  const handleConfirmDelete = async () => {
    const { responseIdx } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, responseIdx: null, studentName: '' });
    setDeletingId(responseIdx);

    try {
      const response = responses[responseIdx];
      const res = await fetch(`/api/forms/${formId}/responses/${response.studentId._id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setResponses(prev => prev.filter((_, idx) => idx !== responseIdx));
        if (selectedStudent === response) {
          setSelectedStudent(null);
          setViewMode('summary');
        }
      } else {
        setErrorModal({ isOpen: true, title: 'Error', message: 'Failed to delete response' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrorModal({ isOpen: true, title: 'Error', message: 'Failed to delete response' });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] pointer-events-auto overflow-hidden border border-gray-200/50">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{formTitle}</h2>
              <div className="flex items-center gap-4 mt-1.5">
                <p className="text-sm text-gray-500 font-medium">
                  {responses.length} {responses.length === 1 ? 'response' : 'responses'} collected
                </p>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <p className="text-sm text-gray-500 font-medium">
                  {questions.length} total questions
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-all hover:bg-gray-50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-8 border-b border-gray-100 bg-white">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 relative ${
                viewMode === 'summary' ? 'text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
              {viewMode === 'summary' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
            {selectedStudent && (
              <button
                onClick={() => setViewMode('individual')}
                className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 relative ${
                  viewMode === 'individual' ? 'text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Individual Details
                {viewMode === 'individual' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Processing form data...</p>
              </div>
            ) : responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 animate-in fade-in duration-500">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl blur-xl opacity-60"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl flex items-center justify-center shadow-lg border border-blue-100/50">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Responses Yet</h3>
                <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed">
                  When students submit their answers, they'll appear here in a neat list.
                </p>
              </div>
            ) : viewMode === 'summary' ? (
              <div className="animate-in fade-in duration-500">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] border-b border-gray-100">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4 text-center">Score</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Submitted</th>
                        <th className="px-6 py-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {responses.map((resp, idx) => {
                        const score = calculateScore(resp);
                        return (
                          <tr 
                            key={idx} 
                            className="group hover:bg-blue-50/30 cursor-pointer transition-all duration-200"
                            onClick={() => {
                              setSelectedStudent(resp);
                              setViewMode('individual');
                            }}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                  {resp.studentId?.name?.charAt(0) || 'S'}
                                </div>
                                <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                  {resp.studentId?.name || 'Anonymous Student'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-sm font-bold ${
                                  score.percentage >= 80 ? 'text-emerald-600' : 
                                  score.percentage >= 60 ? 'text-blue-600' : 'text-rose-500'
                                }`}>
                                  {score.earnedPoints} / {score.totalPoints}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                  {score.percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                resp.isComplete ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {resp.isComplete ? 'Done' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <p className="text-xs font-semibold text-gray-700">
                                {resp.submittedAt ? format(new Date(resp.submittedAt), 'MMM dd') : 'N/A'}
                              </p>
                              <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                                {resp.submittedAt ? format(new Date(resp.submittedAt), 'p') : ''}
                              </p>
                            </td>
                            <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => deleteResponse(idx, e)}
                                disabled={deletingId === idx}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                                title="Delete response"
                              >
                                {deletingId === idx ? (
                                  <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-md">
                      {selectedStudent.studentId?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900 tracking-tight">{selectedStudent.studentId?.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                          Grade: {calculateScore(selectedStudent).percentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewMode('summary')}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Overview
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIdx) => {
                    const studentAnswer = selectedStudent.answers.find(a => a.questionId === q.id)?.answer;
                    const isCorrect = checkAnswer(q, studentAnswer);
                    
                    return (
                      <div key={q.id} className="p-7 border border-gray-100 rounded-3xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                Q{qIdx + 1} • {q.type.replace('_', ' ')}
                              </span>
                              {q.correctAnswer && (
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                  isCorrect ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                                }`}>
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 leading-snug">{q.title}</h4>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-gray-900">{isCorrect ? q.points : 0} / {q.points}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Points</span>
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border-2 transition-all ${
                          isCorrect ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2.5">Student's Response:</p>
                          <div className="text-gray-900 font-semibold text-sm">
                            {Array.isArray(studentAnswer) ? (
                              <div className="flex flex-wrap gap-2">
                                {studentAnswer.map((ans, i) => (
                                  <span key={i} className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm">
                                    {ans}
                                  </span>
                                ))}
                              </div>
                            ) : studentAnswer ? (
                              <p className="whitespace-pre-wrap leading-relaxed">{studentAnswer.toString()}</p>
                            ) : (
                              <p className="text-gray-400 italic font-medium">No answer provided</p>
                            )}
                          </div>
                        </div>

                        {!isCorrect && q.correctAnswer && (
                          <div className="mt-4 p-5 bg-blue-50/40 border border-blue-100 rounded-2xl">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.15em] mb-2">Correct Answer:</p>
                            <p className="text-sm font-bold text-blue-700">
                              {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer.toString()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, responseIdx: null, studentName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Response?"
        message={`Are you sure you want to delete ${deleteConfirm.studentName}'s response? The student will be able to submit again.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deletingId !== null}
        noBackdrop={true}
        zIndex={10001}
      />

      {/* Error Modal */}
      <ConfirmationModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        onConfirm={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
        confirmText="OK"
        showCancel={false}
        variant="danger"
        zIndex={10001}
      />
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default FormResponsesModal;
