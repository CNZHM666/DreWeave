import React from 'react'
import { TreePine } from 'lucide-react'

interface SuccessModalProps {
  open: boolean
  onClose: () => void
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ open, onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div className="text-center" role="dialog" aria-modal="true">
        <div className="animate-bounce-soft">
          <TreePine className="w-24 h-24 text-green-400 mx-auto mb-4" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 text-shadow-md">签到成功！</h3>
        <p className="text-white text-opacity-90 text-shadow-sm">你的小树苗又长大了一点 🌱</p>
      </div>
    </div>
  )
}