import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTasksStore } from '../stores/tasksStore'
import TaskEditorCard from '../components/tasks/TaskEditorCard'
import TaskCard from '../components/tasks/TaskCard'

export default function Tasks() {
  const { user } = useAuthStore()
  const store = useTasksStore()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<string | null>(null)

  React.useEffect(() => { store.load(user?.id) }, [user?.id])

  const handleSave = (data: any) => {
    if (editing) {
      store.update(editing, data)
    } else {
      store.add(data)
    }
    setOpen(false)
    setEditing(null)
  }

  const editTask = (id: string) => { setEditing(id); setOpen(true) }

  const initial = editing ? store.tasks.find(t => t.id === editing) || undefined : undefined

  return (
    <div className="min-h-screen gradient-healing p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white">任务管理</h1>
          <p className="text-blue-100">编辑任务、跟踪进度、展开详情</p>
        </div>
        <div className="mb-4 text-right">
          <button onClick={() => { setEditing(null); setOpen(true) }} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white">编辑任务</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {store.tasks.map(t => (
            <div key={t.id}>
              <TaskCard t={t} />
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => editTask(t.id)} className="px-3 py-2 rounded-2xl bg-blue-600 text-white">编辑</button>
                <button onClick={() => store.remove(t.id)} className="px-3 py-2 rounded-2xl bg-red-600 text-white">删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TaskEditorCard open={open} initial={initial} onClose={() => setOpen(false)} onSave={handleSave} />
    </div>
  )
}