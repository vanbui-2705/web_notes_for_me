import GlassCard from '../components/ui/GlassCard';
import { LifeBuoy, Mail, MessageSquare, BookOpen, ExternalLink } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="animate-fade-slide-up max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-white">Trung tâm hỗ trợ</h1>
        <p className="text-sm text-slate-400">Chúng tôi luôn sẵn sàng hỗ trợ bạn tối ưu hóa hiệu suất làm việc.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support Cards */}
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-amber-400 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Trò chuyện trực tiếp
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Trò chuyện trực tiếp với đội ngũ hỗ trợ kỹ thuật hoặc AI trợ lý để giải đáp mọi thắc mắc 24/7.
            </p>
            <button className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              Bắt đầu trò chuyện
            </button>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" /> Gửi phản hồi qua Email
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Đối với các yêu cầu tùy biến doanh nghiệp hoặc báo cáo lỗi hệ thống phức tạp.
            </p>
            <a
              href="mailto:vanbv.a3k48gtb@gmail.com"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              vanbv.a3k48gtb@gmail.com <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </GlassCard>
        </div>

        {/* Documentation / FAQ */}
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" /> Hướng dẫn & Hỏi đáp
            </h3>
            <p className="text-xs text-slate-400 mt-1">Các câu hỏi thường gặp khi sử dụng TaskFlow.</p>
          </div>

          <div className="space-y-4 divide-y divide-white/5">
            <div className="pt-3 first:pt-0">
              <p className="text-sm font-bold text-slate-200 hover:text-yellow-300 cursor-pointer transition-colors flex items-center justify-between">
                <span>Cách tính điểm XP và tăng cấp độ?</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-40" />
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Mỗi khi bạn hoàn thành một nhiệm vụ, bạn sẽ nhận được 10 XP. Khi tích lũy đủ XP, bạn sẽ tự động tăng cấp độ và mở khóa huy hiệu mới.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-sm font-bold text-slate-200 hover:text-yellow-300 cursor-pointer transition-colors flex items-center justify-between">
                <span>Làm sao để tích hợp biểu đồ Tài chính?</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-40" />
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Mục Tài chính sẽ tự động tính toán dòng tiền 30 ngày qua và hiển thị biểu đồ trực quan dựa trên các giao dịch thu nhập/chi tiêu bạn thêm vào.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

