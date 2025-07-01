
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full ${className}`}>
      {children}
    </div>
  );
};

export default Card;
