import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <span className="text-white font-bold" style={{ fontSize: size === 'xl' ? '2rem' : size === 'lg' ? '1.5rem' : size === 'md' ? '1.25rem' : '1rem' }}>
          S
        </span>
      </div>
      <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent`}>
        SwipeHire
      </span>
    </div>
  );
}