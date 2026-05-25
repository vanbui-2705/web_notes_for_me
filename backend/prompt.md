Yêu Cầu Phát Triển Backend Cho TaskFlow (Giao Diện Mới)
Dựa trên giao diện Frontend mới được thiết kế (bao gồm Dashboard, Daily, Profile, Finance), Backend hiện tại (chỉ có User, Note, Category, Reminder) là chưa đủ để đáp ứng. Để các số liệu trên màn hình là dữ liệu thật, bạn cần xây dựng thêm các Models và API sau:

1. Hệ thống Gamification (Trang Profile & Cày cuốc)
Trang Profile hiển thị Cây năng suất (Tree), Điểm kinh nghiệm (XP), Cấp độ (Level) và Huy hiệu (Badges).

Database Updates:
Thêm trường xp (Integer) và level (Integer) vào bảng User hiện tại.
Models Cần Tạo Mới:
Badge: Lưu danh sách các huy hiệu có trong hệ thống (Early Bird, Streak, Inbox Zero...).
UserBadge: Bảng trung gian (Many-to-Many) lưu trữ xem User nào đã đạt được Badge nào và vào lúc nào.
API Cần Có:
GET /users/me/stats: Trả về tổng XP, Cấp độ hiện tại, XP cần để lên cấp, và % tiến trình.
POST /users/me/add-xp: API ẩn dùng để cộng XP (ví dụ: khi User check "Done" một Task, backend tự động gọi service cộng 10 XP).
GET /users/me/leaderboard: Lấy top User có XP cao nhất.
2. Hệ thống Thói quen & Heatmap (Trang Dashboard & Profile)
Hiện tại bạn mới chỉ có Task (ghi chú công việc một lần). Bạn cần tính năng lặp lại mỗi ngày cho Habit và Streak.

Models Cần Tạo Mới:
Habit: Chứa title, frequency, color, icon, user_id, current_streak, longest_streak.
HabitLog: Ghi nhận lịch sử (Log) - habit_id, date, status (done/missed). Dùng bảng này để vẽ Activity Heatmap.
API Cần Có:
CRUD /habits: Quản lý danh sách thói quen.
POST /habits/{id}/check: Đánh dấu hoàn thành thói quen trong ngày, đồng thời update lại current_streak.
3. Quản lý Tài chính (Trang Finance Hub)
Giao diện Finance yêu cầu quản lý chi tiêu, biểu đồ Cash flow, và mục tiêu tiết kiệm.

Models Cần Tạo Mới:
Transaction: Chứa title, amount (âm là chi tiêu, dương là thu nhập), type_id, date, user_id.
TransactionCategory: (Food, Shopping, Salary,...) kèm icon/màu sắc.
SavingGoal: Mục tiêu tiết kiệm (như mua MacBook) - chứa title, target_amount, current_amount, deadline.
API Cần Có:
CRUD /transactions: Thêm/sửa/xóa giao dịch.
GET /finance/summary: Trả về Total Balance, biểu đồ Cash Flow 30 ngày qua, và tỷ lệ tăng giảm %.
GET /finance/top-spending: Gom nhóm (Group by) category để tìm ra khoản chi tốn kém nhất trong tháng.
4. Theo dõi Chỉ số Hằng ngày (Trang Dashboard)
Trên Dashboard có các widget nhỏ như Tâm trạng (Mood) và Uống nước (Water).

Models Cần Tạo Mới:
DailyMetric (hoặc tách riêng WaterLog, MoodLog): Lưu user_id, date, metric_type (water/mood), và value.
API Cần Có:
POST /metrics/daily: Cập nhật tâm trạng hoặc số cốc nước trong ngày hôm nay.
5. Focus Mode (Trang Daily & Profile)
Trang Daily có bộ đếm ngược 25 phút. Profile thống kê "3 Focus Hours".

Models Cần Tạo Mới:
FocusSession: Lưu user_id, duration_minutes (số phút đã tập trung), task_id (nếu gắn với task cụ thể), và created_at.
API Cần Có:
POST /focus/log: Khi đồng hồ trên Frontend chạy hết 25 phút, gửi request lên Backend để lưu 1 session và cộng XP.
Tổng kết luồng đi (Roadmap Backend)
Bước 1 (Dễ nhất): Update bảng User thêm XP, tạo API cộng điểm khi hoàn thành Note (Task) hiện tại.
Bước 2 (Trung bình): Xây dựng module Finance (Transaction) hoàn toàn mới rẽ nhánh độc lập.
Bước 3 (Khó hơn): Thiết kế Habit & HabitLog để vẽ Heatmap và tính Chuỗi liên tục (Streak). Máy chủ có thể cần một Cronjob (scheduler) lúc 00:00 mỗi ngày để reset Streak nếu người dùng quên check Habit.