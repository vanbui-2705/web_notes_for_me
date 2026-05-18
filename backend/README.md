# Web Note App - Backend

Ứng dụng ghi chú theo ngày/giờ với FastAPI và PostgreSQL.

## Cài đặt

### 1. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 2. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Sửa các thông số trong file `.env`:

- `DATABASE_URL`: Kết nối PostgreSQL
- `SECRET_KEY`: Khóa bí mật cho JWT
- `SMTP_*`: Cấu hình email (optional)

### 3. Tạo database PostgreSQL

```sql
CREATE DATABASE webnotes;
```

### 4. Chạy ứng dụng

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API sẽ chạy tại: `http://localhost:8000`

## API Documentation

Swagger UI: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

## Cấu trúc project

```
backend/
├── main.py           # Ứng dụng FastAPI chính
├── config.py         # Cấu hình
├── database.py       # Kết nối database
├── models.py         # SQLAlchemy models
├── schemas.py        # Pydantic schemas
├── auth.py           # Xác thực & JWT
├── requirements.txt  # Dependencies
└── routers/
    ├── auth.py       # Auth endpoints
    ├── categories.py # Category endpoints
    ├── notes.py      # Note endpoints
    └── reminders.py  # Reminder endpoints
```

## API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập

### Categories
- `GET /categories` - Lấy danh mục
- `POST /categories` - Tạo danh mục
- `DELETE /categories/{id}` - Xóa danh mục

### Notes
- `GET /notes` - Lấy danh sách ghi chú
- `POST /notes` - Tạo ghi chú mới
- `GET /notes/{id}` - Lấy chi tiết ghi chú
- `PUT /notes/{id}` - Cập nhật ghi chú
- `DELETE /notes/{id}` - Xóa ghi chú
- `GET /notes/stats/daily/{date}` - Thống kê theo ngày

### Reminders
- `GET /reminders` - Lấy danh sách nhắc nhở
- `POST /reminders` - Tạo nhắc nhở
- `DELETE /reminders/{id}` - Xóa nhắc nhở