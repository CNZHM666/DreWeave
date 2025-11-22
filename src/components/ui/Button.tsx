import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'fixed'
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '', 
  type = 'button',
  variant = 'primary',
  size = 'md'
}) => {
  const baseClasses = 'font-bold tracking-wide transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2'
  const sizeClasses = {
    md: 'px-6 py-3 rounded-2xl text-lg',
    fixed: 'w-28 h-10 rounded-xl text-sm flex items-center justify-center'
  } as const
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600 focus:ring-pink-400 shadow-lg hover:shadow-xl text-shadow-md drop-shadow-sm',
    secondary: 'bg-pink-50/90 backdrop-blur-sm text-pink-800 border-2 border-pink-300 hover:bg-pink-100 hover:border-pink-400 focus:ring-pink-300 text-shadow-sm drop-shadow-sm',
    ghost: 'bg-transparent text-pink-700 hover:bg-pink-50 focus:ring-pink-300 text-shadow-sm border border-pink-200 hover:border-pink-300 drop-shadow-sm'
  }
  
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed text-shadow-sm' : 'hover:scale-105'
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  )
}