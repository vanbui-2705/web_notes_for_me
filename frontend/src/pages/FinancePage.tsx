import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Coffee, 
  ShoppingBag, 
  Sparkles, 
  Plus, 
  Trash2, 
  X, 
  DollarSign, 
  Target, 
  Gift,
  Coins,
  PiggyBank,
  Zap,
  Send
} from 'lucide-react';
import { financeAPI } from '../lib/apiService';
import type { Transaction, SavingGoal, TransactionCategory, Budget, Debt } from '../types/types';
import GlassCard from '../components/ui/GlassCard';

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [showTxModal, setShowTxModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAction, setContributionAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [contributionNote, setContributionNote] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  const [magicText, setMagicText] = useState('');

  // Transaction form state
  const [newTx, setNewTx] = useState({
    title: '',
    amount: '',
    type: 'expense', // 'income' | 'expense'
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: ''
  });

  // Goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_amount: '',
    deadline: '',
    icon: '🎯',
    color: '#8b5cf6'
  });

  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: ''
  });

  const [newDebt, setNewDebt] = useState({
    person_name: '',
    amount: '',
    type: 'borrow' as 'borrow' | 'lend',
    notes: ''
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Queries
  const { data: summary } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: () => financeAPI.getSummary(30),
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => financeAPI.getTransactions(),
  });

  const { data: goals = [] } = useQuery<SavingGoal[]>({
    queryKey: ['savingGoals'],
    queryFn: () => financeAPI.getGoals(),
  });

  const { data: categories = [] } = useQuery<TransactionCategory[]>({
    queryKey: ['transactionCategories'],
    queryFn: () => financeAPI.getCategories(),
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ['budgets', currentMonth, currentYear],
    queryFn: () => financeAPI.getBudgets(currentMonth, currentYear),
  });

  const { data: debts = [] } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: () => financeAPI.getDebts(),
  });

  // Mutations
  const createTx = useMutation({
    mutationFn: (data: { title: string; amount: number; date: string; note?: string; category_id?: number | null }) => 
      financeAPI.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowTxModal(false);
      setNewTx({
        title: '',
        amount: '',
        type: 'expense',
        category_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: ''
      });
    }
  });

  const createSavingGoal = useMutation({
    mutationFn: (data: { title: string; target_amount: number; deadline?: string; icon?: string; color?: string }) => 
      financeAPI.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingGoals'] });
      setShowGoalModal(false);
      setNewGoal({
        title: '',
        target_amount: '',
        deadline: '',
        icon: '🎯',
        color: '#8b5cf6'
      });
    }
  });

  const contributeGoal = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { amount: number, action: string, note?: string } }) => financeAPI.contributeToGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingGoals'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowContributeModal(false);
      setContributionAmount('');
      setContributionNote('');
    }
  });

  const deleteTx = useMutation({
    mutationFn: (id: number) => financeAPI.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const deleteGoal = useMutation({
    mutationFn: (id: number) => financeAPI.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingGoals'] });
    }
  });

  const magicInputMutation = useMutation({
    mutationFn: (text: string) => financeAPI.magicInput(text),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setMagicText('');
      // Could show toast here: Successfully added...
    }
  });

  const createBudget = useMutation({
    mutationFn: (data: { category_id: number; amount: number; month: number; year: number }) => 
      financeAPI.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowBudgetModal(false);
      setNewBudget({ category_id: '', amount: '' });
    }
  });

  const deleteBudget = useMutation({
    mutationFn: (id: number) => financeAPI.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  const createDebt = useMutation({
    mutationFn: (data: { person_name: string; amount: number; type: 'borrow' | 'lend'; notes?: string }) => 
      financeAPI.createDebt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowDebtModal(false);
      setNewDebt({ person_name: '', amount: '', type: 'borrow', notes: '' });
    }
  });

  const updateDebt = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { is_settled: boolean } }) => financeAPI.updateDebt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const deleteDebt = useMutation({
    mutationFn: (id: number) => financeAPI.deleteDebt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    }
  });

  const handleAddTransaction = () => {
    if (newTx.title.trim() && newTx.amount) {
      const amountVal = parseFloat(newTx.amount);
      const finalAmount = newTx.type === 'expense' ? -Math.abs(amountVal) : Math.abs(amountVal);
      
      createTx.mutate({
        title: newTx.title,
        amount: finalAmount,
        date: newTx.date,
        note: newTx.note,
        category_id: newTx.category_id ? parseInt(newTx.category_id) : null
      });
    }
  };

  const handleAddGoal = () => {
    if (newGoal.title.trim() && newGoal.target_amount) {
      createSavingGoal.mutate({
        title: newGoal.title,
        target_amount: parseFloat(newGoal.target_amount),
        deadline: newGoal.deadline || undefined,
        icon: newGoal.icon,
        color: newGoal.color
      });
    }
  };

  const handleContribute = () => {
    if (selectedGoal && contributionAmount) {
      const amount = parseFloat(contributionAmount);
      if (!isNaN(amount) && amount > 0) {
        contributeGoal.mutate({ 
          id: selectedGoal.id, 
          data: { amount, action: contributionAction, note: contributionNote }
        });
      }
    }
  };

  const getCategorySpent = (categoryId: number) => {
    const currentMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.category_id === categoryId && tx.amount < 0 && txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear;
    });
    return currentMonthTransactions.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  };

  return (
    <div className="animate-fade-slide-up max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white">Finance Hub</h1>
          <p className="text-sm text-slate-400">Manage your quietly ambitious goals.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-yellow-300 transition-colors"
          >
            <PiggyBank className="w-4 h-4" /> + Saving Goal
          </button>
          <button 
            onClick={() => setShowTxModal(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-full"
          >
            <Coins className="w-4 h-4" /> + Transaction
          </button>
        </div>
      </div>

      {/* Magic Input */}
      <GlassCard className="p-2 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        <form 
          className="relative flex items-center gap-3 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (magicText.trim()) {
              magicInputMutation.mutate(magicText.trim());
            }
          }}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            value={magicText}
            onChange={(e) => setMagicText(e.target.value)}
            placeholder="Magic Input: Gõ 'Ăn phở 35k' hoặc 'Nhận lương 15tr'..."
            className="flex-1 bg-transparent border-none text-white text-base focus:ring-0 placeholder-slate-400/50"
            disabled={magicInputMutation.isPending}
          />
          <button 
            type="submit" 
            disabled={!magicText.trim() || magicInputMutation.isPending}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {magicInputMutation.isPending ? 'Đang xử lý...' : <><Send className="w-4 h-4" /> Gửi</>}
          </button>
        </form>
        {magicInputMutation.isError && (
          <div className="mt-2 text-rose-400 text-xs px-2">Lỗi: Không nhận diện được số tiền hoặc danh mục.</div>
        )}
      </GlassCard>

      {/* Grid: Balance and Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: BALANCE & CASH FLOW */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Total Balance Card */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Balance</span>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                  ₫
                </div>
              </div>
              <h2 className="font-display font-black text-4xl mb-2 text-white">
                {summary ? summary.total_balance.toLocaleString() : '0'} ₫
              </h2>
              <div className="flex items-center gap-4 text-xs font-bold mt-4">
                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{summary ? summary.total_income.toLocaleString() : '0'} ₫</span>
                </div>
                <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>-{summary ? summary.total_expense.toLocaleString() : '0'} ₫</span>
                </div>
              </div>
            </GlassCard>

            {/* Savings Goals List */}
            <GlassCard className="flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Savings Goals</h3>
                <div className="space-y-4 max-h-[140px] overflow-y-auto pr-1">
                  {goals.map(goal => {
                    const pct = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
                    return (
                      <div key={goal.id} className="group border-b border-white/5 pb-2 last:border-0 relative">
                        <div className="flex items-center justify-between mb-1.5 cursor-pointer" onClick={() => {
                          setSelectedGoal(goal);
                          setShowContributeModal(true);
                        }}>
                          <div className="flex items-center gap-2 pr-6">
                            <span className="text-lg">{goal.icon || '🎯'}</span>
                            <span className="text-xs font-bold text-slate-200 hover:text-yellow-300 hover:underline">{goal.title}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400">{pct}%</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteGoal.mutate(goal.id); }}
                          className="absolute top-0 right-10 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all z-10"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="progress-track h-2 mb-1.5">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color || 'var(--accent-teal)' }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span>{goal.current_amount.toLocaleString()} ₫ saved</span>
                          <span>{goal.target_amount.toLocaleString()} ₫ goal</span>
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-500">No saving goals yet.</p>
                      <button 
                        onClick={() => setShowGoalModal(true)} 
                        className="text-xs text-amber-400 hover:text-yellow-300 font-bold hover:underline mt-1"
                      >
                        Create your first goal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Cash Flow and Debts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cash Flow Chart */}
            <GlassCard className="h-72 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Cash Flow (30 Days)</h3>
                <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Real-time</div>
              </div>
              
              {/* Visual Bar Chart */}
              <div className="flex-1 flex items-end justify-between gap-1.5 px-2 min-h-[160px] pb-2">
                {summary?.cash_flow_30days.map((flow, i) => {
                  const maxVal = Math.max(...(summary?.cash_flow_30days.map(c => Math.abs(c.amount)) || []), 1);
                  const heightPct = Math.round((Math.abs(flow.amount) / maxVal) * 100);
                  return (
                    <div key={flow.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div 
                        className={`w-full rounded-t transition-all ${flow.amount > 0 ? 'bg-emerald-400 group-hover:bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'bg-rose-400 group-hover:bg-rose-500 shadow-[0_0_8px_rgba(248,113,113,0.3)]'}`}
                        style={{ height: `${Math.max(heightPct, 6)}%` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-white border border-white/10 text-[10px] py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-xl">
                        {format(new Date(flow.date), 'MMM d')}: {flow.amount > 0 ? '+' : ''}{flow.amount.toLocaleString()} ₫
                      </div>
                    </div>
                  );
                })}
                {(!summary?.cash_flow_30days || summary.cash_flow_30days.length === 0) && (
                  <div className="text-center w-full text-xs text-slate-500 py-12 flex flex-col items-center justify-center">
                    <span>No recent activity.</span>
                    <span className="text-[10px] text-slate-600">Add transactions to visualize cash flow.</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Debt & Loan Tracker */}
            <GlassCard className="h-72 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Sổ Ghi Nợ</h3>
                <button 
                  onClick={() => setShowDebtModal(true)}
                  className="text-xs bg-amber-500/10 text-yellow-300 hover:bg-amber-500/20 border border-amber-500/20 font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {debts.map(debt => (
                  <div key={debt.id} className={`p-3 rounded-xl border ${debt.is_settled ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-900/50 border-slate-700'} relative group`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${debt.type === 'borrow' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {debt.type === 'borrow' ? 'Mượn' : 'Cho mượn'}
                        </span>
                        <span className={`font-bold text-sm ${debt.is_settled ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {debt.person_name}
                        </span>
                      </div>
                      <span className={`font-bold text-sm ${debt.is_settled ? 'text-slate-500' : (debt.type === 'borrow' ? 'text-rose-400' : 'text-emerald-400')}`}>
                        {debt.amount.toLocaleString()} ₫
                      </span>
                    </div>
                    {debt.notes && (
                      <p className="text-[10px] text-slate-400 mb-2">{debt.notes}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500">{format(new Date(debt.date), 'MMM d, yyyy')}</span>
                      <div className="flex gap-2">
                        {!debt.is_settled && (
                          <button 
                            onClick={() => updateDebt.mutate({ id: debt.id, data: { is_settled: true } })}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
                          >
                            Đã thanh toán
                          </button>
                        )}
                        <button 
                          onClick={() => deleteDebt.mutate(debt.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {debts.length === 0 && (
                  <div className="text-center w-full text-xs text-slate-500 py-12 flex flex-col items-center justify-center">
                    <span>Không có khoản nợ nào.</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* RIGHT COLUMN: SPENDING & TRANSACTIONS */}
        <div className="space-y-6">
          
          {/* Top Spending Categories */}
          <GlassCard>
            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Top Spending (This Month)</h3>
            <div className="space-y-4">
              {summary?.top_spending_categories.map((item, idx) => {
                const maxVal = Math.max(...(summary?.top_spending_categories.map(c => c.amount) || []), 1);
                const pct = Math.round((item.amount / maxVal) * 100);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: `${item.color}15`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-200">{item.category}</p>
                      <div className="progress-track h-1.5 mt-1.5">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                    <span className="font-bold text-sm text-white">{item.amount.toLocaleString()} ₫</span>
                  </div>
                );
              })}
              {(!summary?.top_spending_categories || summary.top_spending_categories.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-4">No spending categories to display.</p>
              )}
            </div>
          </GlassCard>

          {/* AI Insight Card */}
          <GlassCard className="bg-cyan-500/5 border border-amber-500/20 text-yellow-300">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shadow-sm flex-shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-yellow-300 mb-1">AI Financial Insight</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {summary && summary.total_expense > summary.total_income ? (
                    <span>Your spending is exceeding your income this month. Consider checking your top spending categories to optimize your budget! 📉</span>
                  ) : summary && summary.total_income > 0 ? (
                    <span>Fantastic job! Your cash flow is positive. You are currently saving {Math.round(((summary.total_income - summary.total_expense) / summary.total_income) * 100)}% of your income. 💰</span>
                  ) : (
                    <span>Welcome to your financial hub! Add transactions to unlock personalized budget insights and progress trackers. 🚀</span>
                  )}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Budgets Section */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Ngân sách (Tháng {currentMonth})</h3>
              <button 
                onClick={() => setShowBudgetModal(true)}
                className="text-xs bg-amber-500/10 text-yellow-300 hover:bg-amber-500/20 border border-amber-500/20 font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>
            <div className="space-y-4">
              {budgets.map(budget => {
                const spent = getCategorySpent(budget.category_id);
                const pct = Math.min(Math.round((spent / budget.amount) * 100), 100);
                const isOverBudget = spent >= budget.amount;
                return (
                  <div key={budget.id} className="group relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{budget.category?.icon}</span>
                        <span className="text-sm font-bold text-slate-200">{budget.category?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${isOverBudget ? 'text-rose-400' : 'text-slate-400'}`}>
                          {spent.toLocaleString()} ₫ / {budget.amount.toLocaleString()} ₫
                        </span>
                        <button 
                          onClick={() => deleteBudget.mutate(budget.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {budgets.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Chưa có ngân sách nào được thiết lập.</p>
              )}
            </div>
          </GlassCard>

          {/* Recent Transactions List */}
          <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Recent Transactions</h3>
              <div className="flex bg-slate-900/50 rounded-lg p-1">
                {(['all', 'income', 'expense'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-md uppercase transition-all ${txFilter === f ? 'bg-amber-500/20 text-yellow-300' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {transactions.filter(tx => txFilter === 'all' ? true : (txFilter === 'income' ? tx.amount > 0 : tx.amount < 0)).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 group">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-slate-950/40 border border-white/5"
                  >
                    {tx.category?.icon || (tx.amount > 0 ? '📈' : '📉')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{tx.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ₫
                    </span>
                    <button 
                      onClick={() => deleteTx.mutate(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No transactions logged yet.</p>
              )}
            </div>
          </GlassCard>

        </div>
      </div>

      {/* MODAL 1: ADD TRANSACTION */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-950/80 text-white border border-amber-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(251,183,3,0.15)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">New Transaction</h3>
              <button onClick={() => setShowTxModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-amber-400">Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${newTx.type === 'expense' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'hover:bg-white/5 border-white/10 text-slate-400'}`}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => setNewTx({ ...newTx, type: 'income' })}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${newTx.type === 'income' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'hover:bg-white/5 border-white/10 text-slate-400'}`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Title</label>
                <input
                  type="text"
                  value={newTx.title}
                  onChange={(e) => setNewTx({ ...newTx, title: e.target.value })}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  placeholder="e.g. Starbucks Coffee, Freelance payout..."
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Amount (VNĐ)</label>
                  <input
                    type="number"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl"
                    placeholder="0"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[50000, 100000, 200000, 500000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNewTx({ ...newTx, amount: amt.toString() })}
                        className="text-[10px] font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 border border-white/10 transition-colors"
                      >
                        +{(amt / 1000)}k
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Date</label>
                  <input
                    type="date"
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Category</label>
                <select
                  value={newTx.category_id}
                  onChange={(e) => setNewTx({ ...newTx, category_id: e.target.value })}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl bg-slate-900 text-white"
                >
                  <option value="">Uncategorized</option>
                  {categories
                    .filter(c => c.type === newTx.type)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Note (Optional)</label>
                <textarea
                  value={newTx.note}
                  onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowTxModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium hover:bg-white/5 border border-white/10 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransaction}
                  className="flex-1 btn-primary py-2.5 rounded-xl font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-yellow-300 border border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createTx.isPending || !newTx.title.trim() || !newTx.amount}
                >
                  {createTx.isPending ? 'Logging...' : 'Log Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD SAVING GOAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-950/80 text-white border border-amber-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(251,183,3,0.15)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">New Saving Goal</h3>
              <button onClick={() => setShowGoalModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Goal Name</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  placeholder="e.g. MacBook Pro, Japan Trip..."
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Target Amount (VNĐ)</label>
                  <input
                    type="number"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl"
                    placeholder="1,000,000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Icon</label>
                  <select
                    value={newGoal.icon}
                    onChange={(e) => setNewGoal({ ...newGoal, icon: e.target.value })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl bg-slate-900 text-white"
                  >
                    {['🎯', '💻', '🚗', '✈️', '🏠', '🎁', '🎓', '💵', '🎧'].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Theme Color</label>
                  <select
                    value={newGoal.color}
                    onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl bg-slate-900 text-white"
                  >
                    <option value="#8b5cf6">Purple</option>
                    <option value="#ffb703">Cyan</option>
                    <option value="#10b981">Green</option>
                    <option value="#f59e0b">Amber</option>
                    <option value="#ec4899">Pink</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium hover:bg-white/5 border border-white/10 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGoal}
                  className="flex-1 btn-primary py-2.5 rounded-xl font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-yellow-300 border border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createSavingGoal.isPending || !newGoal.title.trim() || !newGoal.target_amount}
                >
                  {createSavingGoal.isPending ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONTRIBUTE TO GOAL */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-950/80 text-white border border-amber-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(251,183,3,0.15)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">Contribute to {selectedGoal.title}</h3>
              <button onClick={() => setShowContributeModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg">
                <button
                  onClick={() => setContributionAction('deposit')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md uppercase transition-all ${contributionAction === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Nạp tiền (Deposit)
                </button>
                <button
                  onClick={() => setContributionAction('withdraw')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md uppercase transition-all ${contributionAction === 'withdraw' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Rút tiền (Withdraw)
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {contributionAction === 'deposit' ? 'Add funds towards your saving goal of ' : 'Withdraw funds from your saving goal of '}
                  <strong className="text-white">{selectedGoal.target_amount.toLocaleString()} ₫</strong>.
                </p>
                <div className="mt-2 text-xs font-bold text-yellow-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg inline-block">
                  Current Balance: {selectedGoal.current_amount.toLocaleString()} ₫
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Amount (VNĐ)</label>
                <input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Note (Optional)</label>
                <input
                  type="text"
                  value={contributionNote}
                  onChange={(e) => setContributionNote(e.target.value)}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  placeholder="Lý do nạp/rút tiền..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button 
                  className="flex-1 py-2.5 rounded-xl font-medium hover:bg-white/5 border border-white/10 text-slate-300 transition-colors" 
                  onClick={() => setShowContributeModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-yellow-500 hover:bg-yellow-400 text-slate-900 border-none transition-all disabled:opacity-50" 
                  onClick={handleContribute}
                  disabled={contributeGoal.isPending || !contributionAmount}
                >
                  {contributeGoal.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD BUDGET */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-950/80 text-white border border-amber-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(251,183,3,0.15)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">Thiết lập Ngân sách</h3>
              <button onClick={() => setShowBudgetModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Danh mục</label>
                <select
                  value={newBudget.category_id}
                  onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
                  className="input-field mt-1 w-full"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.filter(c => c.type === 'expense').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="input-field mt-1 w-full"
                  placeholder="Ví dụ: 3000000"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors text-slate-400"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (newBudget.category_id && newBudget.amount) {
                      createBudget.mutate({
                        category_id: parseInt(newBudget.category_id),
                        amount: parseFloat(newBudget.amount),
                        month: currentMonth,
                        year: currentYear
                      });
                    }
                  }}
                  className="flex-1 btn-primary py-2.5 rounded-xl disabled:opacity-50"
                  disabled={createBudget.isPending || !newBudget.category_id || !newBudget.amount}
                >
                  {createBudget.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD DEBT */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-950/80 text-white border border-amber-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(251,183,3,0.15)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">Thêm Ghi Nhớ Nợ</h3>
              <button onClick={() => setShowDebtModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Loại</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setNewDebt({ ...newDebt, type: 'borrow' })}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${newDebt.type === 'borrow' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'hover:bg-white/5 border-white/10 text-slate-400'}`}
                  >
                    Mình đi mượn
                  </button>
                  <button
                    onClick={() => setNewDebt({ ...newDebt, type: 'lend' })}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${newDebt.type === 'lend' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'hover:bg-white/5 border-white/10 text-slate-400'}`}
                  >
                    Cho mượn
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Tên người vay / cho mượn</label>
                <input
                  type="text"
                  value={newDebt.person_name}
                  onChange={(e) => setNewDebt({ ...newDebt, person_name: e.target.value })}
                  className="input-field mt-1 w-full"
                  placeholder="Nhập tên..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                  className="input-field mt-1 w-full"
                  placeholder="Ví dụ: 1000000"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  value={newDebt.notes}
                  onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
                  className="input-field mt-1 w-full"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDebtModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors text-slate-400"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (newDebt.person_name && newDebt.amount) {
                      createDebt.mutate({
                        person_name: newDebt.person_name,
                        amount: parseFloat(newDebt.amount),
                        type: newDebt.type,
                        notes: newDebt.notes
                      });
                    }
                  }}
                  className="flex-1 btn-primary py-2.5 rounded-xl disabled:opacity-50"
                  disabled={createDebt.isPending || !newDebt.person_name || !newDebt.amount}
                >
                  {createDebt.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
