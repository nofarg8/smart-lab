
import React, { useState, useCallback } from 'react';
import type { Student, MathTopic, MathExercise, OperationType } from '../../../types';
import TopicSelection from './TopicSelection';
import ExerciseDisplay from './ExerciseDisplay';
import Spinner from '../../ui/Spinner';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { generateExercise } from '../../../services/mathematicalService';

interface MathematicalPathControllerProps {
  student: Student;
  onExit: () => void;
}

type MathStage = 'topic_selection' | 'generating_exercise' | 'exercise';

const MathematicalPathController: React.FC<MathematicalPathControllerProps> = ({ student, onExit }) => {
  const [stage, setStage] = useState<MathStage>('topic_selection');
  const [currentTopic, setCurrentTopic] = useState<MathTopic | null>(null);
  const [exercise, setExercise] = useState<MathExercise | null>(null);
  const [error, setError] = useState<string>('');
  const [key, setKey] = useState(0); // To force re-render of exercise component
  const [lastOperationType, setLastOperationType] = useState<OperationType | undefined>();


  const fetchExercise = useCallback(async (topic: MathTopic, operationType?: OperationType, lastOperationTypeToAvoid?: OperationType) => {
    setStage('generating_exercise');
    setError('');
    try {
      const newExercise = await generateExercise(topic, student.grade, operationType, lastOperationTypeToAvoid);
      if (newExercise) {
        setExercise(newExercise);
        setLastOperationType(newExercise.operationType); // Store the new operation type
        setStage('exercise');
        setKey(prev => prev + 1); // New key to reset ExerciseDisplay state
      } else {
        throw new Error('Failed to generate exercise.');
      }
    } catch (e) {
      console.error(e);
      setError('אירעה שגיאה ביצירת התרגיל. נסו לבחור נושא אחר.');
      setStage('topic_selection');
    }
  }, [student.grade]);

  const handleTopicSelect = (topic: MathTopic) => {
    if (topic === 'average' && (student.grade === 'ג' || student.grade === 'ד')) {
      setError('אין תרגיל ברמתכם, אנא בחרו נושא אחר.');
      setStage('topic_selection');
      return;
    }
    
    setError(''); // Clear error if topic is valid
    setCurrentTopic(topic);
    setLastOperationType(undefined); // Reset when a new topic is selected
    fetchExercise(topic);
  };
  
  const handleNextExercise = () => {
      if(currentTopic) {
          // Request a new exercise, ensuring it's not the same type as the last one (for 4_operations)
          fetchExercise(currentTopic, undefined, lastOperationType);
      }
  };

  const handleTryAgain = () => {
    if(currentTopic && exercise?.operationType) {
          // Request a simpler follow-up exercise of the exact same type
          fetchExercise(currentTopic, exercise.operationType); 
      } else if (currentTopic) {
          // Fallback for topics that don't have operationType
          fetchExercise(currentTopic);
      }
  };

  const handleBackToTopics = () => {
      setStage('topic_selection');
      setExercise(null);
  }

  const renderStage = () => {
    switch (stage) {
      case 'topic_selection':
        return <TopicSelection onSelect={handleTopicSelect} onBack={onExit} />;
      case 'generating_exercise':
        return (
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-[#7371fc] mb-4">מכינה לך תרגיל...</h2>
            <Spinner />
          </Card>
        );
      case 'exercise':
        return exercise ? (
          <ExerciseDisplay 
            key={key}
            exercise={exercise} 
            onNext={handleNextExercise} 
            onTryAgain={handleTryAgain}
            onBackToTopics={handleBackToTopics}
            />
        ) : null;
      default:
        return <p>שלב לא ידוע</p>;
    }
  };

  return (
     <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
       {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4 text-center font-semibold">{error}</p>}
       {renderStage()}
    </div>
  );
};

export default MathematicalPathController;
