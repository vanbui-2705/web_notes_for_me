import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus } from 'lucide-react';
import { useTaskModal } from '../contexts/TaskModalContext';
import { categoriesAPI } from '../lib/apiService';
import GlassCard from '../components/ui/GlassCard';

export default function TaskAddModal() {
  const { isOpen, closeModal, newTask, setNewTask, createNote, isCreating, date } = useTaskModal();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setNewTask({ title: '', time: '9:00 AM', category_id: '', priority: '1' });
    }
  }, [isOpen, setNewTask]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
    >
      <GlassCard className="w-full max-w-md mx-4 p-6 shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-white">Add New Task</h3>
          <button onClick={closeModal} className="p-1 hover:bg-white/10 rounded transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400">Task Title</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="input-field mt-1 w-full"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Date Display (read-only, for reference) */}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400">Date</label>
            <div className="mt-1 p-2.5 rounded-xl bg-slate-950/40 border border-white/10 text-white text-sm">
              {date}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400">Time</label>
            <select
              value={newTask.time}
              onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
              className="input-field mt-1 w-full"
            >
              {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400">Danh mục</label>
            <select
              value={newTask.category_id}
              onChange={(e) => setNewTask({ ...newTask, category_id: e.target.value })}
              className="input-field mt-1 w-full"
            >
              <option value="">Không có danh mục</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400">Độ ưu tiên</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="input-field mt-1 w-full"
            >
              <option value="1">Thấp (1)</option>
              <option value="2">Trung bình (2)</option>
              <option value="3">Cao (3)</option>
              <option value="4">Rất cao (4)</option>
              <option value="5">Khẩn cấp (5)</option>
            </select>
          </div>

          {/* Reward */}
          <div>
            <label className="text-xs font-semibold uppercase text-amber-400 flex items-center gap-1">
              Tiền thưởng (VNĐ) <span className="text-slate-500 normal-case">(Tùy chọn)</span>
            </label>
            <input
              type="number"
              value={newTask.reward_amount}
              onChange={(e) => setNewTask({ ...newTask, reward_amount: e.target.value })}
              className="input-field mt-1 w-full border-amber-500/30 focus:border-amber-400"
              placeholder="Ví dụ: 50000"
            />
            <p className="text-[10px] text-slate-500 mt-1">Hệ thống sẽ cộng tiền khi bạn hoàn thành Task này.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors text-slate-300 border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={createNote}
              className="flex-1 btn-primary py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating || !newTask.title.trim()}
            >
              {isCreating ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
