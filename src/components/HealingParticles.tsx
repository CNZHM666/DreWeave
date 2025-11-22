import React, { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  color: string
}

const HealingParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const generateParticles = (count: number) => {
      const list: Particle[] = []
      const colors = [
        'rgba(184, 230, 209, 0.6)',
        'rgba(230, 230, 250, 0.6)',
        'rgba(135, 206, 235, 0.6)',
        'rgba(255, 218, 185, 0.6)',
        'rgba(255, 228, 225, 0.6)',
      ]
      for (let i = 0; i < count; i++) {
        list.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          duration: Math.random() * 16 + 8,
          delay: Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
      setParticles(list)
    }

    const reduced = document.documentElement.getAttribute('data-reduced-motion') === 'true'
    const dm: number | undefined = (navigator as any).deviceMemory
    const cores = navigator.hardwareConcurrency || 8
    const lowMem = typeof dm === 'number' && dm <= 2
    const lowCpu = cores <= 4
    const base = reduced || lowMem || lowCpu ? 8 : 14
    generateParticles(base)
    return () => {}
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animation: `particleFloat ${particle.duration}s infinite linear`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default HealingParticles