import React from 'react'

export default function TreeGrowth({ stage, visible, onDone }: { stage: 'seedling'|'sapling'|'young'|'mature'; visible: boolean; onDone?: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => { onDone && onDone() }, 1600)
    return () => clearTimeout(t)
  }, [visible])
  const scaleTarget = stage === 'seedling' ? 0.6 : stage === 'sapling' ? 0.85 : stage === 'young' ? 1.1 : 1.3
  return (
    <div ref={ref} className={`fixed inset-0 flex items-center justify-center pointer-events-none ${visible ? '' : 'hidden'}`}>
      <div className="relative w-40 h-40">
        <style>{`
@keyframes treeGrow { 0% { transform: scale(0.4); opacity: 0.5 } 100% { transform: scale(${scaleTarget}); opacity: 1 } }
@keyframes leafPulse { 0% { transform: scale(0.9) } 100% { transform: scale(1.1) } }
`}</style>
        <svg viewBox="0 0 100 120" className="absolute inset-0 mx-auto" style={{ animation: 'treeGrow 1.6s ease-out forwards', willChange: 'transform, opacity' }}>
          <rect x="48" y="60" width="4" height="35" fill="#8D6E63" rx="2" />
          <circle cx="50" cy="55" r="18" fill="#4CAF50" style={{ animation: 'leafPulse 0.8s ease-in-out infinite alternate' }} />
          <circle cx="37" cy="58" r="12" fill="#66BB6A" style={{ animation: 'leafPulse 0.8s ease-in-out infinite alternate' }} />
          <circle cx="63" cy="58" r="12" fill="#66BB6A" style={{ animation: 'leafPulse 0.8s ease-in-out infinite alternate' }} />
          <rect x="20" y="95" width="60" height="6" fill="#795548" rx="3" />
        </svg>
      </div>
    </div>
  )
}