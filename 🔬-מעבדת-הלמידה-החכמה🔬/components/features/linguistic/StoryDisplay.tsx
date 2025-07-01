
import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Spinner from '../../ui/Spinner';
import { useTts } from '../../../hooks/useTts';
import { addNikud } from '../../../services/linguisticService';

interface StoryDisplayProps {
  story: string;
  onProceed: () => void;
  onBack: () => void;
}

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6V6z" /></svg>;


const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, onProceed, onBack }) => {
  const { play, pause, resume, cancel, isPlaying, isPaused } = useTts();
  const [displayedText, setDisplayedText] = useState(story);
  const [isNikud, setIsNikud] = useState(false);
  const [isLoadingNikud, setIsLoadingNikud] = useState(false);
  const [originalStory] = useState(story);

  useEffect(() => {
    return () => cancel(); // Cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTts = () => {
    if (isPlaying) {
        if (isPaused) {
            resume();
        } else {
            pause();
        }
    } else {
        play(displayedText);
    }
  };

  const toggleNikud = async () => {
    cancel(); // Stop any active speech before changing text
    if (isNikud) {
      setDisplayedText(originalStory);
      setIsNikud(false);
    } else {
      setIsLoadingNikud(true);
      const nikudText = await addNikud(originalStory);
      setDisplayedText(nikudText);
      setIsNikud(true);
      setIsLoadingNikud(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="ghost">חזרה</Button>
        <h2 className="text-3xl font-bold text-center text-[#7371fc]">הסיפור שלך!</h2>
        <div className="w-16"></div> {/* Spacer to balance the back button */}
      </div>

      <div className="prose prose-lg max-w-none text-right text-xl leading-relaxed bg-gray-50 p-6 rounded-lg">
        {displayedText.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('## ')) {
                 return (
                    <div key={index} className="not-prose my-6 flex justify-center">
                        <h3 className="bg-gradient-to-r from-purple-200 to-orange-200 text-[#5a58d6] font-bold px-6 py-2 rounded-full shadow-md text-2xl">
                            {paragraph.substring(3).trim()}
                        </h3>
                    </div>
                );
            }
            if (paragraph.trim() === '') return null;
            return <p key={index}>{paragraph}</p>;
        })}
      </div>
      <div className="flex flex-wrap justify-center items-center gap-4">
        <Button onClick={handleTts} className="flex items-center gap-2" variant="primary">
            {isPlaying && !isPaused ? <><PauseIcon /> השהה</> : (isPaused ? <><PlayIcon /> המשך</> : <><PlayIcon /> הקראה 🎧</>)}
        </Button>
        {isPlaying && 
            <Button onClick={cancel} variant="danger" className="flex items-center gap-2">
                <StopIcon/> עצור
            </Button>
        }
        <Button onClick={toggleNikud} variant="ghost" disabled={isLoadingNikud}>
            {isLoadingNikud ? <Spinner size="sm" /> : (isNikud ? 'הסירי ניקוד' : 'הוסיפי ניקוד ✍️')}
        </Button>
      </div>
      <div className="text-center pt-4">
        <Button onClick={onProceed} variant="secondary">הבנתי, קדימה לשאלות! 🎉</Button>
      </div>
    </Card>
  );
};

export default StoryDisplay;
