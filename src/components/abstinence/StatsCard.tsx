import React from 'react'

function stageLabel(stage: 'seedling'|'sapling'|'young'|'mature') {
  if (stage === 'seedling') return '幼苗'
  if (stage === 'sapling') return '小树'
  if (stage === 'young') return '中树'
  return '大树'
}

export default function StatsCard({ total, streak, stage }: { total: number; streak: number; stage: 'seedling'|'sapling'|'young'|'mature' }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="glass-light p-6 rounded-3xl bg-white/30 backdrop-blur-md">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{total}</div>
          <div className="text-blue-800">累计打卡天数</div>
        </div>
      </div>
      <div className="glass-light p-6 rounded-3xl bg-white/30 backdrop-blur-md">
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{streak}</div>
          <div className="text-blue-800">连续打卡天数</div>
        </div>
      </div>
      <div className="glass-light p-6 rounded-3xl bg-white/30 backdrop-blur-md">
        <div className="text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-green-500 text-white font-bold">{stageLabel(stage)}</div>
          <div className="mt-2 text-blue-800">树阶段</div>
        </div>
      </div>
    </div>
  )
}