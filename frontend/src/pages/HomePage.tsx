import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, notesAPI } from '../lib/apiService';
import type { Note, Category } from '../types/types';
import { Plus, Calendar, Clock, Search, Filter, Trash2, Edit2, CheckCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, parseISO, addWeeks, subWeeks, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getAll,
  });

  const { data: notes = [], refetch } = useQuery<Note[]>({
    queryKey: ['notes', selectedDate, searchQuery, selectedCategory],
    queryFn: () => notesAPI.getAll({
      date: format(selectedDate, 'yyyy-MM-dd'),
      search: searchQuery,
      category_id: selectedCategory,
    }),
  });

  const handlePrevDay = () => {
    setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)));
  };

  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleNoteSubmit = async (noteData: any) => {
    try {
      if (editingNote) {
        await notesAPI.update(editingNote.id, noteData);
      } else {
        await notesAPI.create(noteData);
      }
      refetch();
      setShowNoteModal(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Lưu ghi chú thất bại!');
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
      await notesAPI.delete(id);
      refetch();
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowNoteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return 'bg-slate-600';
    const colors = [
      'bg-pink-500', 'bg-violet-500', 'bg-cyan-500',
      'bg-emerald-500', 'bg-amber-500', 'bg-red-500'
    ];
    return colors[(categoryId - 1) % colors.length];
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-400" />
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                Web Note App
              </h1>
            </div>
            <button
              onClick={() => { setEditingNote(null); setShowNoteModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 rounded-lg font-medium transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Ghi chú mới</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Date Navigation */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={viewMode === 'day' ? handlePrevDay : handlePrevWeek}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
              >
                Hôm nay
              </button>
              <button
                onClick={viewMode === 'day' ? handleNextDay : handleNextWeek}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'day'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                Ngày
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'week'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                Tuần
              </button>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              {viewMode === 'day'
                ? format(selectedDate, 'dd MMMM, yyyy', { locale: vi })
                : `${format(weekStart, 'dd/MM', { locale: vi })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: vi })}`}
            </h2>
          </div>

          {/* Week days view */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-2 mt-4">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 rounded-lg transition-all ${
                    isSameDay(day, selectedDate)
                      ? 'bg-indigo-500 text-white'
                      : isToday(day)
                      ? 'bg-pink-500/20 border-2 border-pink-500'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="text-sm font-medium">{format(day, 'dd', { locale: vi })}</div>
                  <div className="text-xs opacity-75">{format(day, 'EEE', { locale: vi })}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm ghi chú..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="grid gap-4">
          {notes.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Chưa có ghi chú</h3>
              <p className="text-slate-400">Bấm vào "Ghi chú mới" để bắt đầu</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="card card-hover cursor-pointer"
                onClick={() => handleEditNote(note)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-1 h-full min-h-[60px] rounded ${getCategoryColor(note.category_id)}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{note.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${getStatusColor(note.status)}`}>
                          {note.status === 'done' ? 'Hoàn thành' : note.status === 'in_progress' ? 'Đang làm' : 'Chưa làm'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}
                            className="p-2 hover:bg-slate-700 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {note.content && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{note.content}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(note.date), 'dd/MM/yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(parseISO(note.date), 'HH:mm')}
                      </span>
                      {note.category && (
                        <span className={`badge ${getCategoryColor(note.category.id)} text-white`}>
                          {note.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <NoteModal
          note={editingNote}
          categories={categories}
          onSubmit={handleNoteSubmit}
          onClose={() => { setShowNoteModal(false); setEditingNote(null); }}
        />
      )}
    </div>
  );
}

// Note Modal Component
function NoteModal({ note, categories, onSubmit, onClose }: any) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [date, setDate] = useState(note?.date ? note.date.slice(0, 16) : format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [status, setStatus] = useState(note?.status || 'todo');
  const [priority, setPriority] = useState(note?.priority || 1);
  const [categoryId, setCategoryId] = useState(note?.category_id || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      content,
      date: new Date(date).toISOString(),
      status,
      priority: Number(priority),
      category_id: categoryId || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
          {note ? 'Sửa ghi chú' : 'Ghi chú mới'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nội dung</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngày giờ</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">Chưa làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ưu tiên (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Danh mục</label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Không có</option>
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 rounded-lg font-medium transition-all"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}