import React from 'react'
import type { ThemeName } from './types'

interface NoteModalProps {
  open: boolean
  onClose: () => void
  note: string
  onChange: (v: string) => void
  onSubmit: () => void
  theme?: ThemeName
}

export const NoteModal: React.FC<NoteModalProps> = ({ open, onClose, note, onChange, onSubmit, theme = 'default' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="glass rounded-3xl p-6 w-[520px] modal-enter" role="dialog" aria-modal="true">
        <h3 className="text-2xl font-bold mb-4 text-blue-900">签到备注</h3>
        <p className="text-sm text-blue-800 mb-3">请输入至少5个字符，帮助你记录今天的感受或目标</p>
        <textarea
          className="input-healing w-full h-28 text-sm"
          value={note}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例如：完成阅读30分钟，心情平静"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300" onClick={onClose} aria-label="关闭">取消</button>
          <button className="px-4 py-2 rounded-xl bg-[#4CAF50] text-white hover:bg-[#43A047]" onClick={onSubmit} aria-label="提交">提交</button>
        </div>
      </div>
    </div>
  )
}