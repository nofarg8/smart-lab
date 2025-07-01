import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? ((current) / total) * 100 : 0;
  const filledPercentage = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
      <div
        className="bg-gradient-to-r from-[#80ed99] to-[#7371fc] h-4 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${filledPercentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;