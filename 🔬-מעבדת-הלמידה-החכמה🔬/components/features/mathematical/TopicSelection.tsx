
import React from 'react';
import type { MathTopic } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

interface TopicSelectionProps {
  onSelect: (topic: MathTopic) => void;
  onBack: () => void;
}

const allTopics: { id: MathTopic; name: string; emoji: string }[] = [
  { id: '4_operations', name: '4 פעולות החשבון', emoji: '➕➖✖️➗' },
  { id: 'fractions', name: 'שברים', emoji: '🍕' },
  { id: 'average', name: 'ממוצע', emoji: '📊' },
  { id: 'word_problems', name: 'בעיות מילוליות', emoji: '📝' },
];

const TopicSelection: React.FC<TopicSelectionProps> = ({ onSelect, onBack }) => {

  return (
    <Card>
      <div className="flex justify-between items-center mb-8">
        <Button onClick={onBack} variant="ghost">חזרה</Button>
        <h2 className="text-3xl font-bold text-center text-[#7371fc]">בחירת נושא לתרגול</h2>
        <div className="w-16"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allTopics.map(topic => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic.id)}
            className="p-6 bg-white rounded-xl border-2 border-transparent hover:border-[#ffa62b] hover:shadow-lg transition-all text-center group"
          >
            <div className="text-5xl mb-4 transition-transform group-hover:scale-110">{topic.emoji}</div>
            <h3 className="text-2xl font-bold text-gray-800">{topic.name}</h3>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default TopicSelection;
