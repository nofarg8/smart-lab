
import React, { useState, useEffect } from 'react';
import type { ComprehensionData, MCQ } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

interface ComprehensionQuestionsProps {
  data: ComprehensionData | null;
  onComplete: (answers: string[]) => void;
  onBackToStory: () => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
}

const ComprehensionQuestions: React.FC<ComprehensionQuestionsProps> = ({ data, onComplete, onBackToStory, currentQuestionIndex, setCurrentQuestionIndex }) => {
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, { answer: string; status: 'unanswered' | 'correct' | 'incorrect_1' | 'incorrect_2' }>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<number, string>>({});
  
  useEffect(() => {
    setMcqAnswers({});
    setOpenAnswers({});
  }, [data]);

  if (!data) {
    return <Card><p>טוען שאלות...</p></Card>;
  }

  const { mcqs, openQuestions } = data;
  const totalQuestions = mcqs.length + openQuestions.length;
  const isMcq = currentQuestionIndex < mcqs.length;
  const currentMcq = isMcq ? mcqs[currentQuestionIndex] : null;
  const currentOpenQIndex = isMcq ? -1 : currentQuestionIndex - mcqs.length;
  const currentOpenQ = isMcq ? null : openQuestions[currentOpenQIndex];

  const handleMcqSelect = (selectedOption: string) => {
    if (!currentMcq) return;
    const currentStatus = mcqAnswers[currentQuestionIndex]?.status || 'unanswered';
    if (currentStatus === 'correct' || currentStatus === 'incorrect_2') return;

    const isCorrect = currentMcq.correctAnswer === selectedOption;
    if (isCorrect) {
        setMcqAnswers(prev => ({...prev, [currentQuestionIndex]: { answer: selectedOption, status: 'correct' }}));
    } else {
        const newStatus = currentStatus === 'unanswered' ? 'incorrect_1' : 'incorrect_2';
        setMcqAnswers(prev => ({...prev, [currentQuestionIndex]: { answer: selectedOption, status: newStatus }}));
    }
  };

  const handleOpenAnswerChange = (value: string) => {
    setOpenAnswers(prev => ({...prev, [currentOpenQIndex]: value }));
  };
  
  const getButtonClass = (option: string) => {
      const defaultState = 'bg-white hover:bg-indigo-50 border-2 border-indigo-200 text-indigo-700 hover:border-indigo-400';
      if (!currentMcq) return defaultState;
      const state = mcqAnswers[currentQuestionIndex];
      if (!state) return defaultState;
      
      const isSelected = state.answer === option;
      const isCorrect = currentMcq.correctAnswer === option;

      // After 2nd mistake, only highlight the correct answer in green.
      if (state.status === 'incorrect_2') {
          if (isCorrect) return 'bg-[#80ed99] text-black font-bold border-green-600 animate-pulse';
          // All other buttons (including the user's wrong choice) are just disabled.
          return 'bg-gray-100 text-gray-500 border-gray-300'; 
      }
      
      if (state.status === 'correct' && isCorrect) return 'bg-[#80ed99] text-black font-bold border-green-600';
      if (state.status === 'incorrect_1' && isSelected) return 'bg-[#ffa62b] text-white font-bold border-orange-600';
      
      // Disable other options once the question is "locked" by a correct or first-wrong answer
      if (state.status === 'correct' || (state.status === 'incorrect_1' && isSelected)) {
          if (!isSelected) return 'bg-gray-100 text-gray-500 border-gray-300';
      }

      return defaultState;
  };
  
  const handleNext = () => {
      if (currentQuestionIndex < totalQuestions - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
          // Collect answers in order: MCQs first, then open-ended questions
          const mcqFinalAnswers = mcqs.map((_, index) => mcqAnswers[index]?.answer || '');
          const openFinalAnswers = openQuestions.map((_, index) => openAnswers[index] || '');
          const finalAnswers = [...mcqFinalAnswers, ...openFinalAnswers];
          onComplete(finalAnswers);
      }
  };
  
  const handleBack = () => {
      if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else {
          onBackToStory();
      }
  };

  const isNextDisabled = () => {
    if (isMcq) {
        const status = mcqAnswers[currentQuestionIndex]?.status;
        return status !== 'correct' && status !== 'incorrect_2';
    } else {
        return !openAnswers[currentOpenQIndex]?.trim();
    }
  };

  const currentStatus = isMcq ? mcqAnswers[currentQuestionIndex]?.status : 'unanswered';

  return (
    <Card className="p-0 overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-[#7371fc] to-[#a855f7]">
            <div className="flex justify-between items-center">
                <Button type="button" variant="ghost" onClick={handleBack} className="bg-white/20 text-white border-white/50 hover:bg-white/30">חזרה</Button>
                <h2 className="text-2xl font-bold text-center text-white">שאלה {currentQuestionIndex + 1} מתוך {totalQuestions}</h2>
                <div className="w-20"></div> {/* Spacer */}
            </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Question Area */}
          {isMcq && currentMcq && (
              <div className="space-y-6">
                <p className="text-2xl font-semibold text-center text-indigo-900 p-6 bg-indigo-100 rounded-xl min-h-[8rem] flex items-center justify-center shadow-inner">{currentMcq.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentMcq.options.map(option => (
                    <button
                      key={option}
                      onClick={() => handleMcqSelect(option)}
                      disabled={ currentStatus === 'correct' || currentStatus === 'incorrect_2' }
                      className={`p-4 rounded-lg font-semibold text-lg text-right transition-all w-full shadow-sm disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none ${getButtonClass(option)}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="text-center font-bold mt-4 text-xl min-h-[2rem]">
                    {currentStatus === 'incorrect_1' && <p className="text-[#ffa62b]">תשובה לא נכונה, נסו שוב!</p>}
                    {currentStatus === 'incorrect_2' && <p className="text-orange-600">זו לא התשובה הנכונה. התשובה הנכונה מודגשת בירוק.</p>}
                    {currentStatus === 'correct' && <p className="text-green-600">מעולה, תשובה נכונה!</p>}
                </div>
              </div>
          )}

          {currentOpenQ && (
              <div className="space-y-4">
                  <label className="block text-2xl font-semibold text-center text-indigo-900 p-6 bg-indigo-100 rounded-xl min-h-[8rem] flex items-center justify-center shadow-inner">{currentOpenQ}</label>
                  <textarea 
                    onChange={(e) => handleOpenAnswerChange(e.target.value)}
                    value={openAnswers[currentOpenQIndex] || ''}
                    className="w-full p-4 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-[#7371fc] h-36 text-lg"
                    placeholder="כתבו את תשובתכם כאן..."
                  />
              </div>
          )}

          <div className="text-center pt-4">
            <Button onClick={handleNext} disabled={isNextDisabled()} variant="secondary" className="disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100">
              {currentQuestionIndex < totalQuestions - 1 ? 'השאלה הבאה' : 'סיימתי!'}
            </Button>
          </div>
        </div>
    </Card>
  );
};

export default ComprehensionQuestions;
