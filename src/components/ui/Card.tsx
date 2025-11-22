import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`card-healing ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}