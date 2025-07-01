import React, { useState } from 'react';
import type { LinguisticAnswers, StoryType, FavoritePlace, Color } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

interface IntroQuestionsProps {
  onSubmit: (data: LinguisticAnswers) => void;
  onBack: () => void;
}

const storyTypes: StoryType[] = ['הרפתקאות', 'חיות', 'מצחיק', 'קסם', 'משפחה'];
const storyTypeEmojis: Record<StoryType, string> = { 'הרפתקאות': '🦸‍♀️', 'חיות': '🐾', 'מצחיק': '😂', 'קסם': '✨', 'משפחה': '👨‍👩‍👧‍👦' };
const places: FavoritePlace[] = ['בית', 'טבע', 'בית ספר', 'ספורט', 'יצירה'];
const placeEmojis: Record<FavoritePlace, string> = { 'בית': '🏠', 'טבע': '🌳', 'בית ספר': '📚', 'ספורט': '🏊‍♀️', 'יצירה': '🎨' };
const colors: Color[] = ['כחול', 'אדום', 'ירוק', 'צהוב', 'סגול', 'כתום', 'ורוד', 'כולם'];
const colorHex: Record<Color, string> = { 'כחול': '#3b82f6', 'אדום': '#ef4444', 'ירוק': '#22c55e', 'צהוב': '#eab308', 'סגול': '#a855f7', 'כתום': '#f97316', 'ורוד': '#ec4899', 'כולם': 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)' };

const IntroQuestions: React.FC<IntroQuestionsProps> = ({ onSubmit, onBack }) => {
  const [answers, setAnswers] = useState<Partial<LinguisticAnswers>>({ colors: [] });

  const handleMultiSelect = (field: keyof LinguisticAnswers, value: any) => {
    setAnswers(prev => {
        const currentValues = (prev[field] as any[]) || [];
        // If it's already included, remove it
        if (currentValues.includes(value)) {
            return { ...prev, [field]: currentValues.filter(v => v !== value) };
        }
        // If we are about to add a new one, check the limit
        if (currentValues.length < 2) {
            return { ...prev, [field]: [...currentValues, value] };
        } else {
            alert('אפשר לבחור עד שני צבעים בלבד.');
            return prev; // Return previous state without changes
        }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.storyType && answers.achievement && answers.favoritePlace && answers.roleModel && answers.colors && answers.colors.length > 0) {
        onSubmit(answers as LinguisticAnswers);
    } else {
        alert('יש למלא את כל השדות כדי להמשיך');
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-[#7371fc] to-[#a855f7]">
            <div className="flex justify-between items-center">
                <Button type="button" variant="ghost" onClick={onBack} className="bg-white/20 text-white border-white/50 hover:bg-white/30">חזרה</Button>
                <h2 className="text-2xl font-bold text-center text-white">שאלות היכרות</h2>
                <div className="w-20"></div> {/* Spacer */}
            </div>
        </div>
      <form onSubmit={handleSubmit} className="space-y-8 p-8">
        {/* Story Type */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">איזה סוג סיפור את/ה הכי אוהב/ת?</label>
          <div className="flex flex-wrap gap-3">
            {storyTypes.map(type => (
              <button type="button" key={type} onClick={() => setAnswers(p => ({...p, storyType: type}))} className={`px-4 py-2 text-lg rounded-full border-2 transition-all ${answers.storyType === type ? 'bg-[#7371fc] text-white border-[#7371fc] shadow-md' : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'}`}>
                {storyTypeEmojis[type]} {type}
              </button>
            ))}
          </div>
        </div>

        {/* Achievement */}
        <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">ספר/י בקצרה על משהו שהצלחת בו או גאה בו: (עד 30 מילים)</label>
            <input type="text" maxLength={150} onChange={e => setAnswers(p => ({...p, achievement: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]"/>
        </div>

        {/* Favorite Place */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">איזה מקום הכי אוהב/ת להיות בו?</label>
          <div className="flex flex-wrap gap-3">
            {places.map(place => (
              <button type="button" key={place} onClick={() => setAnswers(p => ({...p, favoritePlace: place}))} className={`px-4 py-2 text-lg rounded-full border-2 transition-all ${answers.favoritePlace === place ? 'bg-[#7371fc] text-white border-[#7371fc] shadow-md' : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'}`}>
                {placeEmojis[place]} {place}
              </button>
            ))}
          </div>
        </div>
        
        {/* Role Model */}
        <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">לאיזו דמות מספר או סרט את/ה מתחבר/ת במיוחד?</label>
            <input type="text" onChange={e => setAnswers(p => ({...p, roleModel: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7371fc]"/>
        </div>
        
        {/* Colors */}
        <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">איזה צבעים מרגישים לך טוב? (עד 2)</label>
            <div className="flex flex-wrap gap-3 items-center">
                {colors.map(color => (
                    <button type="button" key={color} onClick={() => handleMultiSelect('colors', color)}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${answers.colors?.includes(color) ? 'border-[#7371fc] scale-110 shadow-md' : 'border-transparent'}`}
                    style={{ background: colorHex[color] }}
                    aria-label={color}
                    ></button>
                ))}
            </div>
        </div>
        
        <div className="text-center pt-4">
            <Button type="submit" variant="secondary">צרי לי סיפור! ✨</Button>
        </div>
      </form>
    </Card>
  );
};

export default IntroQuestions;