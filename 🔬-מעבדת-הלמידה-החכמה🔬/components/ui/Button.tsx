import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'font-bold rounded-full shadow-lg transform transition-transform duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-4';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-[#7371fc] hover:bg-purple-700 focus:ring-purple-300 text-white',
    secondary: 'bg-[#ffa62b] hover:bg-orange-500 focus:ring-orange-300 text-white',
    success: 'bg-[#80ed99] hover:bg-green-500 focus:ring-green-300 text-white',
    danger: 'bg-[#f4989c] hover:bg-pink-500 focus:ring-pink-300 text-white',
    ghost: 'bg-transparent border-2 border-[#7371fc] text-[#7371fc] hover:bg-[#7371fc] hover:text-white focus:ring-purple-300'
  };

  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;