import React, { useState } from 'react';
import type { MathExercise } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

// Renders a vertical fraction.
const VerticalFraction: React.FC<{ num: string; den: string }> = ({ num, den }) => (
    <span className="inline-flex flex-col text-center font-semibold mx-1" style={{ verticalAlign: 'middle', position: 'relative', top: '-0.3em' }}>
        <span className="leading-none">{num}</span>
        <span className="border-t-2 border-current w-full"></span>
        <span className="leading-none">{den}</span>
    </span>
);

// Renders a full math expression string, correctly handling fractions and operators within any text.
const renderMathExpression = (expression: string) => {
    // Standardize operators and split the string by any fraction pattern (mixed or simple)
    const standardized = expression.replace(/\s*x\s*/gi, ' × ').replace(/\*/g, ' × ').replace(/:/g, '/');
    const parts = standardized.split(/(\d+\s+\d+\/\d+|\d+\/\d+)/g).filter(Boolean);

    return parts.map((part, index) => {
        // Match mixed number: e.g., "1 2/3"
        const mixedNumberMatch = part.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        if (mixedNumberMatch) {
            return (
                <span key={index} className="inline-flex items-center mx-1" dir="ltr">
                    <span className="font-semibold">{mixedNumberMatch[1]}</span>
                    <VerticalFraction num={mixedNumberMatch[2]} den={mixedNumberMatch[3]} />
                </span>
            );
        }

        // Match simple fraction: e.g., "1/2"
        const fractionMatch = part.match(/^(\d+)\/(\d+)$/);
        if (fractionMatch) {
            return <VerticalFraction key={index} num={fractionMatch[1]} den={fractionMatch[2]} />;
        }
        
        // Return other parts of the string (text, operators) as they are
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
};

// Heuristic to check if a line is primarily a mathematical expression.
const isPurelyMathematical = (line: string): boolean => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return false;
  
  // A line is mathematical if it contains math symbols and does not contain significant Hebrew text.
  const hasMathChars = /[\d\+\-\×\÷\/\=\.\,]/.test(trimmedLine);
  const hebrewChars = (trimmedLine.match(/[\u0590-\u05FF]/g) || []).length;
  
  // Allow for a few Hebrew chars (e.g., for variable names or short words) but prioritize math.
  return hasMathChars && hebrewChars < 5;
};

interface ExerciseDisplayProps {
  exercise: MathExercise;
  onNext: () => void;
  onTryAgain: () => void;
  onBackToTopics: () => void;
}

const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({ exercise, onNext, onTryAgain, onBackToTopics }) => {
  const [feedback, setFeedback] = useState<'unanswered' | 'incorrect_1' | 'incorrect_2' | 'correct'>('unanswered');
  const [explanationVisible, setExplanationVisible] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  
  const [simpleAnswer, setSimpleAnswer] = useState('');
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [quotient, setQuotient] = useState('');
  const [remainder, setRemainder] = useState('');

  const isFraction = exercise.answer.includes('/');
  const isRemainder = exercise.answer.includes(',');
  const isVerticalMath = exercise.problemText.includes('\n') && !exercise.problemText.includes('/');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let currentAnswer = '';
    if (isFraction) {
      currentAnswer = `${numerator}/${denominator}`;
    } else if (isRemainder) {
      currentAnswer = `${quotient},${remainder}`;
    } else {
      currentAnswer = simpleAnswer;
    }

    if (currentAnswer.trim().replace(/\s/g, '') === exercise.answer.trim().replace(/\s/g, '')) {
      setFeedback('correct');
      setHintVisible(false);
    } else {
      if (feedback === 'unanswered') {
        setFeedback('incorrect_1');
      } else {
        setFeedback('incorrect_2');
        setHintVisible(false);
      }
    }
  };
  
  // Renders any line of text, deciding its directionality automatically.
  const renderLine = (line: string, index: number) => {
    if (isPurelyMathematical(line)) {
        return (
            <div key={index} dir="ltr" className="text-center font-mono text-lg my-2 p-2 bg-gray-100 rounded">
                {renderMathExpression(line)}
            </div>
        );
    }
    // For text lines, process for bolding
    const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
    return (
        <p key={index} dir="rtl" className="text-right my-1">
            {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                }
                return <React.Fragment key={partIndex}>{part}</React.Fragment>;
            })}
        </p>
    );
  };
  
  const renderFormattedText = (text: string | undefined) => {
      if (!text) return null;
      return text.split('\n').map(renderLine);
  };


  const renderProblem = () => {
    if (isVerticalMath) {
        return <pre dir="ltr" className="font-mono text-center text-3xl md:text-4xl">{exercise.problemText}</pre>;
    }
    
    return exercise.problemText.split('\n').map((line, index) => {
        if (isPurelyMathematical(line)) {
             return (
                <div key={index} dir="ltr" className="w-full text-center flex items-center justify-center flex-wrap gap-x-2">
                    {renderMathExpression(line)}
                </div>
            );
        }
        // For RTL lines with embedded fractions, maintain RTL direction but parse for fractions.
        return <p key={index} dir="rtl" className="w-full text-center">{renderMathExpression(line)}</p>
    });
  };

  const renderInputs = () => {
    if (isFraction) {
      return (
        <div className="flex flex-col items-center gap-1 font-mono text-3xl">
          <input type="text" value={numerator} onChange={(e) => setNumerator(e.target.value)} className="w-24 p-2 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]"/>
          <div className="w-28 h-1 bg-gray-800"></div>
          <input type="text" value={denominator} onChange={(e) => setDenominator(e.target.value)} className="w-24 p-2 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]"/>
        </div>
      );
    }
    if (isRemainder) {
      return (
        <div className="flex items-end gap-4">
            <input type="text" value={quotient} onChange={(e) => setQuotient(e.target.value)} className="p-4 text-2xl w-28 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]" placeholder="תשובה"/>
            <div className="flex flex-col items-center">
                <input type="text" value={remainder} onChange={(e) => setRemainder(e.target.value)} className="p-2 text-xl w-20 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]" placeholder="?"/>
                <label className="text-sm text-gray-600">שארית</label>
            </div>
        </div>
      );
    }
    return (
      <input type="text" dir="ltr" value={simpleAnswer} onChange={(e) => setSimpleAnswer(e.target.value)} className="p-4 text-2xl w-full max-w-xs text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]" placeholder="?"/>
    );
  };

  return (
    <Card className="w-full">
      <div className="flex justify-start mb-4">
        <Button onClick={onBackToTopics} variant="ghost">חזרה לבחירת נושא</Button>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Visualization */}
        <div className="w-full lg:w-1/2 bg-gray-50 rounded-lg p-4 flex justify-center items-center self-stretch">
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(exercise.visualization)}`} alt="Pedagogical visualization" className="max-w-full h-auto rounded" />
        </div>
        
        {/* Problem and Interaction */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="text-3xl md:text-4xl text-gray-800 p-4 bg-purple-50 rounded-lg min-h-[10rem] flex items-center justify-center">
             {renderProblem()}
          </div>

          {feedback !== 'correct' && feedback !== 'incorrect_2' && (
             <div className="flex justify-center">
                <Button onClick={() => setHintVisible(v => !v)} variant="ghost" size="sm">
                    {hintVisible ? 'הסתירי דרך' : 'הראי לי דרך'} 🤔
                </Button>
             </div>
          )}
          
          {hintVisible && exercise.explanationHint && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg animate-fade-in text-right">
                <div className="text-gray-700 space-y-2">{renderFormattedText(exercise.explanationHint)}</div>
            </div>
          )}
          
          {feedback !== 'correct' && feedback !== 'incorrect_2' && (
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
              {renderInputs()}
              <Button type="submit" variant="primary">בדיקה</Button>
               {feedback === 'incorrect_1' && <p className="text-lg font-bold text-[#ffa62b]">תשובה לא נכונה. נסו שוב!</p>}
            </form>
          )}

          {feedback === 'correct' && (
            <div className="text-center p-4 bg-green-100 rounded-lg border border-green-400">
              <h3 className="text-2xl font-bold text-green-700 mb-2">מעולה! תשובה נכונה!</h3>
              
              {!explanationVisible && (
                  <Button onClick={() => setExplanationVisible(true)} variant="ghost">הראי הסבר</Button>
              )}

              {explanationVisible && (
                <div className="animate-fade-in text-right">
                    <p className="text-lg text-gray-700 mt-2 font-bold">הנה ההסבר:</p>
                    <div className="text-lg text-gray-700 space-y-2">{renderFormattedText(exercise.explanation)}</div>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-4">
                  <Button onClick={onNext} variant="secondary">תרגיל הבא</Button>
              </div>
            </div>
          )}

          {feedback === 'incorrect_2' && (
             <div className="text-center p-4 bg-red-100 rounded-lg border border-red-400">
              <h3 className="text-2xl font-bold text-red-700 mb-2">אוי, זו לא התשובה הנכונה.</h3>
              <p className="text-lg font-semibold text-gray-800 mb-4">התשובה הנכונה היא: **{exercise.answer.replace(',', ' עם שארית ')}**</p>
              
              {!explanationVisible && (
                  <Button onClick={() => setExplanationVisible(true)} variant="ghost">הראי הסבר</Button>
              )}

              {explanationVisible && (
                <div className="animate-fade-in text-right">
                    <p className="text-lg text-gray-700 mt-2 font-bold">הנה ההסבר:</p>
                    <div className="text-lg text-gray-700 space-y-2">{renderFormattedText(exercise.explanation)}</div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                  <Button onClick={onTryAgain} variant="secondary">אני רוצה תרגיל דומה</Button>
                  <Button onClick={onNext} variant="primary">תרגיל הבא</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ExerciseDisplay;