# TaskFlow Backend

Backend API cho ứng dụng TaskFlow - Quản lý công việc, thói quen, tài chính với gamification.

## Công nghệ

- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL với SQLAlchemy (async)
- **Authentication:** JWT tokens
- **Features:** Gamification, Habits, Finance, Focus Mode

## Cài đặt

### 1. Tạo và kích hoạt virtual environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Cấu hình environment variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Sửa các thông số trong file `.env`:

```
# Database
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/taskflow

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 4. Tạo database PostgreSQL

```sql
CREATE DATABASE taskflow;
```

### 5. Seed dữ liệu mặc định

Tạo các badge mặc định cho hệ thống:

```bash
python seed_badges.py
```

### 6. Chạy server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API sẽ chạy tại: `http://localhost:8000`

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Đăng ký tài khoản mới |
| POST | `/login` | Đăng nhập |

### Notes & Tasks (`/api/notes`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | Lấy danh sách ghi chú |
| POST | `/notes` | Tạo ghi chú mới |
| GET | `/notes/{id}` | Lấy chi tiết ghi chú |
| PUT | `/notes/{id}` | Cập nhật ghi chú |
| DELETE | `/notes/{id}` | Xóa ghi chú |
| GET | `/notes/stats/daily/{date}` | Thống kê theo ngày |

### Categories (`/api/categories`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Lấy danh mục |
| POST | `/categories` | Tạo danh mục mới |
| DELETE | `/categories/{id}` | Xóa danh mục |

### Reminders (`/api/reminders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reminders` | Lấy danh sách nhắc nhở |
| POST | `/reminders` | Tạo nhắc nhở |
| DELETE | `/reminders/{id}` | Xóa nhắc nhở |

### Gamification (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me/stats` | Lấy thống kê XP, level, badges |
| POST | `/users/me/add-xp` | Cộng XP (tự động khi hoàn thành task) |
| GET | `/users/me/leaderboard` | Top user có XP cao nhất |

### Habits (`/api/habits`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/habits` | Lấy danh sách thói quen |
| POST | `/habits` | Tạo thói quen mới |
| GET | `/habits/{id}` | Lấy chi tiết thói quen |
| PUT | `/habits/{id}` | Cập nhật thói quen |
| DELETE | `/habits/{id}` | Xóa thói quen |
| POST | `/habits/{id}/check` | Check-in thói quen |
| POST | `/habits/{id}/uncheck` | Undo check-in |
| POST | `/habits/cron/check-missed` | Check missed habits (cron job) |

### Finance (`/api/finance`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/finance/categories` | Danh mục giao dịch |
| POST | `/finance/categories` | Tạo danh mục |
| DELETE | `/finance/categories/{id}` | Xóa danh mục |
| GET | `/finance/transactions` | Danh sách giao dịch |
| POST | `/finance/transactions` | Tạo giao dịch |
| PUT | `/finance/transactions/{id}` | Cập nhật giao dịch |
| DELETE | `/finance/transactions/{id}` | Xóa giao dịch |
| GET | `/finance/goals` | Danh mục mục tiêu tiết kiệm |
| POST | `/finance/goals` | Tạo mục tiêu |
| PUT | `/finance/goals/{id}` | Cập nhật mục tiêu |
| DELETE | `/finance/goals/{id}` | Xóa mục tiêu |
| POST | `/finance/goals/{id}/contribute` | Đóng góp vào mục tiêu |
| GET | `/finance/summary` | Tổng quan tài chính |

### Daily Metrics & Focus (`/api/metrics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metrics/daily` | Lấy daily metrics |
| POST | `/metrics/daily` | Tạo/cập nhật metric |
| GET | `/metrics/daily/{date}/{type}` | Lấy metric cụ thể |
| PUT | `/metrics/daily/{id}` | Cập nhật metric |
| DELETE | `/metrics/daily/{id}` | Xóa metric |
| GET | `/metrics/focus` | Lấy focus sessions |
| POST | `/metrics/focus` | Log focus session |
| POST | `/metrics/focus/log` | Log completed session |
| GET | `/metrics/focus/summary` | Tổng quan focus |

## Cấu trúc dữ liệu

### Models

- **User:** Thông tin người dùng (email, username, xp, level)
- **Note:** Ghi chú/công việc (title, content, date, status, priority)
- **Category:** Danh mục cho notes
- **Reminder:** Nhắc nhở cho notes
- **Badge:** Huy hiệu trong hệ thống
- **UserBadge:** Mối quan hệ user-badge
- **Habit:** Thói quen hàng ngày
- **HabitLog:** Lịch sử check habit
- **Transaction:** Giao dịch tài chính
- **TransactionCategory:** Danh mục giao dịch
- **SavingGoal:** Mục tiêu tiết kiệm
- **DailyMetric:** Chỉ số hàng ngày (mood, water, etc.)
- **FocusSession:** Phiên tập trung

## Gamification System

### XP & Level

- Mỗi task hoàn thành: +10 XP
- Mỗi habit check-in: +5 XP
- Mỗi phút focus: +1 XP
- Công thức level: `level = int(xp / 100) + 1`

### Badges

Hệ thống có các badge mặc định:
- 🌅 Early Bird - Hoàn thành 5 task trước 9h
- 🔥 Streak Master - 7 ngày streak
- 💪 Habit Builder - 30 ngày streak
- ⚔️ Task Slayer - 100 task hoàn thành
- 🥷 Productivity Ninja - 500 task hoàn thành
- ⭐ XP Collector - 1000 XP
- 👑 Level 10 - Đạt cấp độ 10
- 🎯 Focus Master - 10 giờ tập trung
- 💰 Finance Guru - 100 giao dịch
- 📭 Inbox Zero - Không task tồn đọng

## Cron Jobs

Để tự động check missed habits, cần chạy cron job mỗi ngày lúc 00:00:

```bash
POST /api/habits/cron/check-missed
```

Có thể sử dụng Windows Task Scheduler hoặc cron trên Linux.

## Cấu trúc project

```
backend/
├── main.py           # FastAPI app & router registration
├── config.py         # Settings configuration
├── database.py       # Database connection
├── models.py         # SQLAlchemy models
├── schemas.py        # Pydantic schemas
├── auth.py           # Authentication & JWT
├── requirements.txt  # Dependencies
├── seed_badges.py    # Seed script for badges
└── routers/
    ├── auth.py       # Auth endpoints
    ├── categories.py # Category endpoints
    ├── notes.py      # Note endpoints
    ├── reminders.py  # Reminder endpoints
    ├── gamification.py # XP, levels, badges
    ├── habits.py     # Habits & streaks
    ├── finance.py    # Transactions & goals
    └── metrics.py    # Daily metrics & focus
```

## Development

### Chạy với hot reload

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Test API

Sử dụng Swagger UI tại `http://localhost:8000/docs` hoặc curl:

```bash
# Đăng ký
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "username": "test", "password": "test123"}'

# Đăng nhập
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123"}'
```

## Production

### Chạy với gunicorn

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## License

MIT License