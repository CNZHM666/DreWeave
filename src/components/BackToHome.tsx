import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

interface BackToHomeProps {
  className?: string
  showText?: boolean
  text?: string
}

const BackToHome: React.FC<BackToHomeProps> = ({ 
  className = '', 
  showText = true, 
  text = '返回主页' 
}) => {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-700 hover:from-primary-700 hover:to-accent-800 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg border border-white border-opacity-30 ${className}`}
      title={text}
    >
      <Home className="w-4 h-4" />
      {showText && <span className="text-sm font-medium">{text}</span>}
    </button>
  )
}

export default BackToHome