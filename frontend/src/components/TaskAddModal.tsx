import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, FileText, ClipboardList } from 'lucide-react';
import { useTaskModal } from '../contexts/TaskModalContext';
import { categoriesAPI } from '../lib/apiService';
import GlassCard from '../components/ui/GlassCard';

export default function TaskAddModal() {
  const { isOpen, closeModal, newTask, setNewTask, createNote, isCreating, importBulkNotes, isBulkCreating, date } = useTaskModal();

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setNewTask({ title: '', time: '9:00 AM', category_id: '', priority: '1', reward_amount: '' });
      setBulkText('');
      setActiveTab('single');
    }
  }, [isOpen, setNewTask]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };

  const handleBulkSubmit = async () => {
    if (bulkText.trim()) {
      await importBulkNotes(bulkText);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
    >
      <GlassCard className="w-full max-w-md mx-4 p-6 shadow-2xl animate-scale-up border border-white/10 relative overflow-hidden" accentColor="var(--accent-purple)">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-black text-lg text-white">Tạo Công Việc Mới</h3>
          <button onClick={closeModal} className="p-1 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Premium Tab Switcher */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl mb-5 border border-white/5">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'single'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Thêm 1 việc
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> Nhập từ Docs/Sheets
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          
          {/* TAB 1: Single Task Title */}
          {activeTab === 'single' ? (
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Tên công việc</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="input-field mt-1.5 w-full p-2.5 rounded-xl border border-white/10 bg-slate-950/40 text-white"
                placeholder="Bạn cần làm việc gì hôm nay?"
                autoFocus
              />
            </div>
          ) : (
            /* TAB 2: Bulk Textarea */
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Danh sách công việc (Mỗi việc một dòng)</label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="input-field mt-1.5 w-full h-32 p-3 text-xs bg-slate-950/40 border border-white/10 rounded-xl text-white resize-none"
                placeholder="Dán danh sách công việc của bạn tại đây...&#10;Ví dụ:&#10;Thiết kế trang sản phẩm&#10;Gặp gỡ khách hàng lúc 10h&#10;Viết tài liệu hướng dẫn"
                autoFocus
              />
              <p className="text-[9px] text-slate-500 mt-1.5 font-medium leading-tight">
                💡 Hướng dẫn: Bạn hãy copy-paste trực tiếp từ Google Docs hoặc kéo chọn cột công việc trong Google Sheets rồi dán vào đây! Hệ thống sẽ tạo nhanh mỗi dòng thành một Task mới.
              </p>
            </div>
          )}

          {/* SHARED METADATA SECTION */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Date Display */}
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase text-slate-400">Ngày thực hiện</label>
              <div className="mt-1 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-white text-xs font-bold">
                📅 {date}
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Thời gian</label>
              <select
                value={newTask.time}
                onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                className="input-field mt-1 w-full p-2 rounded-xl bg-slate-950/40 text-white text-xs"
              >
                {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(t => (
                  <option key={t} value={t} className="bg-slate-950">{t}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Danh mục</label>
              <select
                value={newTask.category_id}
                onChange={(e) => setNewTask({ ...newTask, category_id: e.target.value })}
                className="input-field mt-1 w-full p-2 rounded-xl bg-slate-950/40 text-white text-xs"
              >
                <option value="" className="bg-slate-950">Không có danh mục</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-950">{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Độ ưu tiên</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="input-field mt-1 w-full p-2 rounded-xl bg-slate-950/40 text-white text-xs"
              >
                <option value="1" className="bg-slate-950">Thấp (1)</option>
                <option value="2" className="bg-slate-950">Trung bình (2)</option>
                <option value="3" className="bg-slate-950">Cao (3)</option>
                <option value="4" className="bg-slate-950">Rất cao (4)</option>
                <option value="5" className="bg-slate-950">Khẩn cấp (5)</option>
              </select>
            </div>

            {/* Reward */}
            <div>
              <label className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1">
                Tiền thưởng (VNĐ)
              </label>
              <input
                type="number"
                value={newTask.reward_amount}
                onChange={(e) => setNewTask({ ...newTask, reward_amount: e.target.value })}
                className="input-field mt-1 w-full p-2 rounded-xl bg-slate-950/40 border-amber-500/20 text-white text-xs focus:border-amber-400"
                placeholder="Ví dụ: 50000"
              />
            </div>
          </div>

          <p className="text-[9px] text-slate-500 font-medium">Hệ thống sẽ cộng tiền thưởng vào Ví tài chính khi bạn hoàn thành Task này.</p>

          {/* Modal Actions */}
          <div className="flex gap-3 pt-3 border-t border-white/5">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs hover:bg-white/5 transition-colors text-slate-400 border border-white/10 cursor-pointer"
            >
              Hủy
            </button>
            
            {activeTab === 'single' ? (
              <button
                onClick={createNote}
                className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={isCreating || !newTask.title.trim()}
              >
                {isCreating ? 'Đang thêm...' : 'Thêm Task'}
              </button>
            ) : (
              <button
                onClick={handleBulkSubmit}
                className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer animate-pulse"
                disabled={isBulkCreating || !bulkText.trim()}
              >
                {isBulkCreating ? 'Đang nhập...' : 'Nhập Hàng Loạt'}
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
