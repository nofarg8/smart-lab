import React from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

interface PreImagePromptProps {
    onGenerate: () => void;
    onBack: () => void;
}

const PreImagePrompt: React.FC<PreImagePromptProps> = ({ onGenerate, onBack }) => {
    return (
        <Card className="text-center flex flex-col items-center gap-6 animate-fade-in">
             <div className="w-full flex justify-start">
                <Button onClick={onBack} variant="ghost">חזרה לשאלות</Button>
            </div>
            <div className="text-6xl">🥳</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#7371fc]">כל הכבוד! השלמת את כל המשימות!</h2>
            <p className="text-xl md:text-2xl text-gray-600">
                ולכן זכית בפרס מיוחד...
                <br/>
                אני אצור עבורך את התמונה האישית שלך, על פי התשובות שענית!
            </p>
            <Button onClick={onGenerate} variant="secondary" className="text-xl mt-4">
                צרי את התמונה שלי! 🖼️
            </Button>
        </Card>
    );
};

export default PreImagePrompt;