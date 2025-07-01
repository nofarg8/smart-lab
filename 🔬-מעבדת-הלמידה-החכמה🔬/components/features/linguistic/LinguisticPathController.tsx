
import React, { useState } from 'react';
import type { Student, LinguisticAnswers, ComprehensionData, Color } from '../../../types';
import IntroQuestions from './IntroQuestions';
import StoryDisplay from './StoryDisplay';
import ComprehensionQuestions from './ComprehensionQuestions';
import PreImagePrompt from './PreImagePrompt';
import ImageResult from './ImageResult';
import Spinner from '../../ui/Spinner';
import ProgressBar from '../../ui/ProgressBar';
import { generateStory, generateQuestions, generateImage } from '../../../services/linguisticService';

interface LinguisticPathControllerProps {
  student: Student;
  onExit: () => void;
}

type LinguisticStage = 'intro' | 'generating_story' | 'story' | 'questions' | 'pre_image_prompt' | 'generating_image' | 'image_result';

const LinguisticPathController: React.FC<LinguisticPathControllerProps> = ({ student, onExit }) => {
  const [stage, setStage] = useState<LinguisticStage>('intro');
  const [answers, setAnswers] = useState<LinguisticAnswers | null>(null);
  const [story, setStory] = useState<string>('');
  const [comprehensionData, setComprehensionData] = useState<ComprehensionData | null>(null);
  const [userComprehensionAnswers, setUserComprehensionAnswers] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleStartStoryGeneration = async (data: LinguisticAnswers) => {
    setAnswers(data);
    setStage('generating_story');
    setError('');
    try {
      const generatedStory = await generateStory(student, data);
      setStory(generatedStory);
      const generatedQuestions = await generateQuestions(generatedStory, student.grade);
      setComprehensionData(generatedQuestions);
      setStage('story');
    } catch (e) {
      setError('אירעה שגיאה ביצירת הסיפור. נסו שוב.');
      setStage('intro');
    }
  };
  
  const handleProceedToQuestions = () => {
    setCurrentQuestion(0);
    setStage('questions');
  };

  const handleFinishQuestions = (finalAnswers: string[]) => {
    setUserComprehensionAnswers(finalAnswers);
    setStage('pre_image_prompt');
  };

  const handleGenerateImage = async () => {
    setStage('generating_image');
    setError('');
    try {
        const image = await generateImage(story, student.name, userComprehensionAnswers, answers?.colors as Color[]);
        setGeneratedImage(image);
        setStage('image_result');
    } catch(e) {
        setError('אירעה שגיאה ביצירת התמונה. נסו שוב.');
        setStage('questions'); // Go back to questions if image fails
    }
  };

  const totalQuestions = comprehensionData ? (comprehensionData.mcqs.length + comprehensionData.openQuestions.length) : 0;

  const renderStage = () => {
    switch (stage) {
      case 'intro':
        return <IntroQuestions onSubmit={handleStartStoryGeneration} onBack={onExit} />;
      case 'generating_story':
        return <div className="text-center">
            <h2 className="text-2xl font-bold text-[#7371fc] mb-4">יוצרת לך סיפור מיוחד...</h2>
            <Spinner />
        </div>;
      case 'story':
        return <StoryDisplay story={story} onProceed={handleProceedToQuestions} onBack={() => setStage('intro')} />;
      case 'questions':
        return (
            <>
                <ProgressBar current={currentQuestion} total={totalQuestions} />
                <ComprehensionQuestions 
                    data={comprehensionData} 
                    onComplete={handleFinishQuestions}
                    onBackToStory={() => setStage('story')}
                    currentQuestionIndex={currentQuestion}
                    setCurrentQuestionIndex={setCurrentQuestion}
                />
            </>
        );
      case 'pre_image_prompt':
        return <PreImagePrompt onGenerate={handleGenerateImage} onBack={() => setStage('questions')} />;
      case 'generating_image':
        return <div className="text-center">
            <h2 className="text-2xl font-bold text-[#7371fc] mb-4">כעת ניצור את התמונה המיוחדת שלך...</h2>
            <Spinner />
        </div>;
      case 'image_result':
        return <ImageResult imageBase64={generatedImage} onRestart={() => setStage('intro')} onExit={onExit} />;
      default:
        return <p>שלב לא ידוע</p>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-4">
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</p>}
      {renderStage()}
    </div>
  );
};

export default LinguisticPathController;
