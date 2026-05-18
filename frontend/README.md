# Web Note App - Frontend

Ứng dụng web ghi chú theo ngày/giờ với React và TypeScript.

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy development server

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

### 3. Build production

```bash
npm run build
npm run preview
```

## Công nghệ sử dụng

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Axios** - HTTP client
- **date-fns** - Date utilities
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

## Cấu trúc project

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── lib/            # API utilities
│   ├── pages/          # Page components
│   ├── types/          # TypeScript types
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Features

- ✅ Đăng ký/Đăng nhập
- ✅ Xem ghi chú theo ngày/tuần
- ✅ Tạo/Sửa/Xóa ghi chú
- ✅ Tìm kiếm ghi chú
- ✅ Lọc theo danh mục
- ✅ Trạng thái công việc (Todo, In Progress, Done)
- ✅ Ưu tiên công việc
- ✅ Giao diện hiện đại, responsive