# Web Note App - Hướng Dẫn Sử Dụng

## Giới thiệu

Web Note App là ứng dụng web giúp bạn quản lý các công việc và ghi chú theo ngày/giờ với giao diện hiện đại và dễ sử dụng.

## Công nghệ

- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **Styling:** Custom CSS với gradient và animations

## Yêu cầu hệ thống

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

## Cài đặt

### 1. Setup Database

```sql
-- Tạo database
CREATE DATABASE webnotes;

-- Tạo user (tùy chọn)
CREATE USER webnotes_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE webnotes TO webnotes_user;
```

### 2. Setup Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env từ .env.example
cp .env.example .env

# Chỉnh sửa file .env với thông tin database của bạn
# DATABASE_URL=postgresql://username:password@localhost:5432/webnotes

# Chạy server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: `http://localhost:8000`

### 3. Setup Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Hướng dẫn sử dụng

### Đăng ký tài khoản

1. Truy cập http://localhost:3000
2. Bấm "Đăng ký ngay"
3. Điền thông tin: Họ tên, Email, Mật khẩu
4. Bấm "Đăng ký"

### Đăng nhập

1. Truy cập http://localhost:3000/login
2. Nhập Email và Mật khẩu
3. Bấm "Đăng nhập"

### Tạo ghi chú mới

1. Bấm nút "Ghi chú mới" ở góc phải trên cùng
2. Điền thông tin:
   - **Tiêu đề:** Tên công việc
   - **Nội dung:** Mô tả chi tiết (tùy chọn)
   - **Ngày giờ:** Thời gian thực hiện
   - **Trạng thái:** Chưa làm / Đang làm / Hoàn thành
   - **Ưu tiên:** 1-5 (5 là cao nhất)
   - **Danh mục:** Phân loại công việc (tùy chọn)
3. Bấm "Lưu"

### Xem ghi chú theo ngày/tuần

- **Chế độ Ngày:** Xem ghi chú của một ngày cụ thể
- **Chế độ Tuần:** Xem ghi chú của cả tuần
- Dùng nút mũi tên để chuyển ngày/tuần
- Bấm "Hôm nay" để quay về ngày hiện tại

### Tìm kiếm và lọc

- **Tìm kiếm:** Nhập từ khóa vào ô tìm kiếm
- **Lọc theo danh mục:** Chọn danh mục từ dropdown

### Sửa/Xóa ghi chú

- **Sửa:** Bấm vào ghi chú hoặc nút chỉnh sửa
- **Xóa:** Bấm nút xóa (thùng rác)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `POST /api/categories` - Tạo danh mục mới
- `DELETE /api/categories/{id}` - Xóa danh mục

### Notes
- `GET /api/notes` - Lấy danh sách ghi chú
- `POST /api/notes` - Tạo ghi chú mới
- `GET /api/notes/{id}` - Lấy chi tiết ghi chú
- `PUT /api/notes/{id}` - Cập nhật ghi chú
- `DELETE /api/notes/{id}` - Xóa ghi chú

### Reminders
- `GET /api/reminders` - Lấy danh sách nhắc nhở
- `POST /api/reminders` - Tạo nhắc nhở
- `DELETE /api/reminders/{id}` - Xóa nhắc nhở

## Cấu hình Email (Tùy chọn)

Để bật tính năng nhắc nhở qua email:

1. Mở file `backend/.env`
2. Điền thông tin SMTP:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

3. Với Gmail, bạn cần tạo App Password:
   - Vào Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Tạo app password cho "Mail"

## Deploy Production

### Backend

```bash
# Build và chạy với gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Frontend

```bash
# Build
npm run build

# Preview production build
npm run preview
```

## License

MIT License