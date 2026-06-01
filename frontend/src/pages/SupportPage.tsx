import { FormEvent, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  LifeBuoy,
  Mail,
  MessageSquare,
  Send,
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useAuth } from '../contexts/AuthContext';

const FAQS = [
  {
    question: 'Cach tinh XP va tang cap do?',
    answer: 'Hoan thanh task nhan 10 XP, check-in habit nhan 5 XP, va focus mode cong XP theo so phut tap trung.',
  },
  {
    question: 'Vi sao streak bi reset?',
    answer: 'Streak duoc tinh theo ngay dang hoat dong. Neu bo qua mot ngay khong vao app, chuoi hien tai se bat dau lai tu 1.',
  },
  {
    question: 'Lam sao ket noi frontend voi backend deploy?',
    answer: 'Tren Vercel hay dat VITE_API_URL bang URL backend Render kem /api o cuoi, vi frontend goi cac endpoint nhu /auth/login.',
  },
  {
    question: 'Du lieu tai chinh duoc tinh nhu the nao?',
    answer: 'Trang Finance tong hop giao dich theo thu nhap, chi tieu, danh muc va muc tieu tiet kiem trong database cua tai khoan.',
  },
];

type ChatMessage = {
  role: 'user' | 'support';
  text: string;
};

export default function SupportPage() {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'support', text: 'Chao ban, minh co the giup ve deploy, streak, task, finance hoac loi dang nhap.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const suggestedReply = useMemo(() => {
    const text = chatInput.toLowerCase();
    if (text.includes('deploy') || text.includes('render') || text.includes('vercel')) {
      return 'Khi deploy, hay kiem tra Render /health truoc, sau do dat VITE_API_URL tren Vercel = backend-url/api.';
    }
    if (text.includes('streak') || text.includes('chuoi') || text.includes('lua')) {
      return 'Streak duoc cap nhat khi ban dang nhap hoac vao app moi ngay. Moc 100 se mo giao dien legend.';
    }
    if (text.includes('login') || text.includes('dang nhap')) {
      return 'Neu dang nhap loi, hay kiem tra backend dang chay, DATABASE_URL dung, va token trong localStorage con hop le.';
    }
    return 'Minh da ghi nhan. Neu can gui chi tiet hon, dung form email ben duoi de tao noi dung mail nhanh.';
  }, [chatInput]);

  const sendChat = (event: FormEvent) => {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    setChatMessages((messages) => [
      ...messages,
      { role: 'user', text },
      { role: 'support', text: suggestedReply },
    ]);
    setChatInput('');
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    const cleanSubject = subject.trim() || 'TaskFlow support request';
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setStatus('Nhap noi dung can ho tro truoc khi gui.');
      return;
    }

    const body = [
      `User: ${user?.username || 'unknown'}`,
      `Email tai khoan: ${user?.email || 'unknown'}`,
      '',
      cleanMessage,
    ].join('\n');

    window.location.href = `mailto:vanbv.a3k48gtb@gmail.com?subject=${encodeURIComponent(cleanSubject)}&body=${encodeURIComponent(body)}`;
    setStatus('Da mo ung dung email voi noi dung ho tro.');
  };

  return (
    <div className="animate-fade-slide-up max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-white">Ho tro</h1>
        <p className="text-sm text-slate-400">Tra cuu nhanh, chat noi bo va tao email bao loi.</p>
      </div>

      {status && (
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4" accentColor="#38bdf8">
            <h3 className="font-display font-bold text-lg text-cyan-300 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Chat ho tro nhanh
            </h3>

            <div className="h-72 overflow-y-auto rounded-xl bg-slate-950/40 border border-white/5 p-3 space-y-3">
              {chatMessages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      item.role === 'user'
                        ? 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-50'
                        : 'bg-white/5 border border-white/10 text-slate-200'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                className="input-field flex-1"
                placeholder="Nhap cau hoi..."
              />
              <button
                type="submit"
                className="btn-primary px-4 flex items-center gap-2 rounded-xl"
                disabled={!chatInput.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-6 space-y-4" accentColor="#818cf8">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-300" /> Gui phan hoi qua email
            </h3>

            <form onSubmit={submitEmail} className="space-y-3">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="input-field w-full"
                placeholder="Tieu de"
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="input-field w-full min-h-[120px] resize-none"
                placeholder="Mo ta loi hoac yeu cau can ho tro..."
              />
              <button type="submit" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
                Tao email <ExternalLink className="w-4 h-4" />
              </button>
            </form>
          </GlassCard>
        </div>

        <GlassCard className="p-6 space-y-6" accentColor="#22c55e">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-300" /> Huong dan & FAQ
            </h3>
            <p className="text-xs text-slate-400 mt-1">Mo tung cau hoi de xem cau tra loi.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <button
                  key={item.question}
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full rounded-xl bg-slate-950/40 border border-white/5 p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-100">{item.question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isOpen && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.answer}</p>}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 flex gap-3">
            <LifeBuoy className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-100 leading-relaxed">
              Neu loi lien quan database hoac deploy, hay kem URL backend, anh chup loi console va thoi diem xay ra loi trong email.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
