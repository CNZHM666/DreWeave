import React, { useState } from 'react'

type Props<T> = {
  items: T[]
  itemHeight: number
  height: number
  render: (item: T, index: number) => React.ReactNode
}

export default function VirtualList<T>({ items, itemHeight, height, render }: Props<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const total = items.length
  const visible = Math.ceil(height / itemHeight) + 4
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2)
  const end = Math.min(total, start + visible)
  const offsetTop = start * itemHeight
  return (
    <div style={{ height, overflowY: 'auto' }} onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}>
      <div style={{ height: total * itemHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetTop, left: 0, right: 0 }}>
          {items.slice(start, end).map((item, i) => (
            <div key={(item as any)?.id ?? start + i} style={{ height: itemHeight }}>
              {render(item, start + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}