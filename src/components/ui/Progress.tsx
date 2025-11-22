import React from 'react'

interface ProgressProps {
  value: number
  className?: string
  max?: number
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  className = '', 
  max = 100 
}) => {
  const percentage = Math.min(Math.max(value, 0), max)
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <div 
        className="h-full bg-gradient-to-r from-mint-400 to-lavender-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}