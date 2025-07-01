import React from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Spinner from '../../ui/Spinner';

interface ImageResultProps {
  imageBase64: string | null;
  onRestart: () => void;
  onExit: () => void;
}

const ImageResult: React.FC<ImageResultProps> = ({ imageBase64, onRestart, onExit }) => {
    
  const handleDownload = () => {
    if (!imageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${imageBase64}`;
    link.download = 'nofar-creation.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="text-center">
      <h2 className="text-3xl font-bold text-[#7371fc] mb-4">היצירה המיוחדת שלך!</h2>
      <p className="text-lg text-gray-600 mb-6">כל הכבוד על המסע שעברת! הנה תמונה שיצרתי במיוחד בשבילך.</p>
      
      <div className="mb-8 w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
        {imageBase64 ? (
          <img src={`data:image/jpeg;base64,${imageBase64}`} alt="AI generated art" className="w-full h-full object-contain" />
        ) : (
          <Spinner />
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={handleDownload} disabled={!imageBase64} variant="primary">
          הורדת תמונה 🖼️
        </Button>
        <Button onClick={onRestart} variant="secondary">
          ליצירת סיפור חדש
        </Button>
         <Button onClick={onExit} variant="ghost">
          חזרה למסך הראשי
        </Button>
      </div>
    </Card>
  );
};

export default ImageResult;