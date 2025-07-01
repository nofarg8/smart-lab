
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = '#7371fc' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-24 h-24',
    };

    return (
        <div className="flex justify-center items-center">
            <div
                className={`animate-spin rounded-full border-t-4 border-b-4 ${sizeClasses[size]}`}
                style={{ borderColor: color, borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
            ></div>
        </div>
    );
};

export default Spinner;
