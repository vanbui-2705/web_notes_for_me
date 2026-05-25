import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Trash2, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  CheckSquare, 
  Wallet,
  ShieldAlert as ShieldIcon
} from 'lucide-react';
import { adminAPI } from '../lib/apiService';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { user: currentAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const usersPerPage = 20;

  // Queries
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: () => adminAPI.getMetrics(),
  });

  const { data: allUsers = [], isLoading: usersLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminAPI.getUsers(page * usersPerPage, usersPerPage),
  });

  // Mutations
  const toggleActiveMutation = useMutation({
    mutationFn: (userId: number) => adminAPI.toggleActive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    }
  });

  const toggleAdminMutation = useMutation({
    mutationFn: (userId: number) => adminAPI.toggleAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    }
  });

  // Search logic
  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleActive = (userId: number) => {
    if (userId === currentAdmin?.id) {
      alert("Bạn không thể tự khóa tài khoản của chính mình!");
      return;
    }
    toggleActiveMutation.mutate(userId);
  };

  const handleToggleAdmin = (userId: number) => {
    if (userId === currentAdmin?.id) {
      alert("Bạn không thể tự gỡ quyền Admin của chính mình!");
      return;
    }
    toggleAdminMutation.mutate(userId);
  };

  return (
    <div className="animate-fade-slide-up max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-400" /> Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400">System management & business intelligence center.</p>
        </div>
      </div>

      {/* Metrics Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <GlassCard className="p-5 border-l-4 border-l-blue-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
              <h3 className="font-display font-black text-3xl text-white">
                {metricsLoading ? '...' : metrics?.total_users}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Active Users */}
        <GlassCard className="p-5 border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Users</p>
              <h3 className="font-display font-black text-3xl text-emerald-400">
                {metricsLoading ? '...' : metrics?.total_active_users}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Total Tasks/Notes */}
        <GlassCard className="p-5 border-l-4 border-l-purple-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
              <h3 className="font-display font-black text-3xl text-purple-400">
                {metricsLoading ? '...' : metrics?.total_notes}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>

        {/* Total Transactions */}
        <GlassCard className="p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
              <h3 className="font-display font-black text-3xl text-amber-400">
                {metricsLoading ? '...' : metrics?.total_transactions}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* User Management Section */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white">User Management</h3>
            <p className="text-xs text-slate-400">Manage user privileges, active status and view metrics.</p>
          </div>
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm user theo tên, email..."
              className="w-full bg-slate-950/40 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto">
          {usersLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Đang tải danh sách người dùng...</div>
          ) : error ? (
            <div className="text-center py-12 text-rose-400 text-sm">Gặp lỗi khi tải dữ liệu người dùng.</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">Không tìm thấy người dùng nào.</div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Level / XP</th>
                  <th className="py-3.5 px-4 text-center">Tasks</th>
                  <th className="py-3.5 px-4 text-center">Finance</th>
                  <th className="py-3.5 px-4">Quyền</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => {
                  const isSelf = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                      {/* User Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${localStorage.getItem('avatar-seed-' + u.id) || u.username}&backgroundColor=f1f5f9`} 
                            alt="avatar" 
                            className="w-10 h-10 rounded-full border border-purple-500/20 bg-slate-800"
                          />
                          <div>
                            <span className="font-bold text-white block">
                              {u.username} {isSelf && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full ml-1 font-normal">(Tôi)</span>}
                            </span>
                            <span className="text-xs text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Level / XP */}
                      <td className="py-4 px-4 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold px-2 py-0.5 rounded-lg">
                            Lv.{u.level}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">({u.xp} XP)</span>
                        </div>
                      </td>

                      {/* Tasks count */}
                      <td className="py-4 px-4 text-center font-bold text-purple-400">
                        {u.notes_count}
                      </td>

                      {/* Transactions count */}
                      <td className="py-4 px-4 text-center font-bold text-amber-400">
                        {u.transactions_count}
                      </td>

                      {/* Admin role */}
                      <td className="py-4 px-4">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" /> Admin
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold bg-slate-800 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full">
                            Thành viên
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {u.is_active ? (
                          <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse">
                            Bị khóa
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Admin Privilege */}
                          <button
                            onClick={() => handleToggleAdmin(u.id)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-xl border transition-all ${
                              u.is_admin 
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20' 
                                : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400'
                            } disabled:opacity-30 disabled:pointer-events-none`}
                            title={u.is_admin ? "Gỡ quyền Admin" : "Nâng quyền Admin"}
                          >
                            <ShieldIcon className="w-4 h-4" />
                          </button>

                          {/* Toggle Active (Block/Unblock) */}
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-xl border transition-all ${
                              u.is_active 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            } disabled:opacity-30 disabled:pointer-events-none`}
                            title={u.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
