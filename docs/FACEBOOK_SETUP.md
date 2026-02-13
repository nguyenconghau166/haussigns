# Hướng Dẫn Cấu Hình Tự Động Đăng Bài Lên Facebook Fanpage

Tính năng này cho phép hệ thống tự động đăng bài viết mới lên Fanpage Facebook ngay khi bạn chuyển trạng thái bài viết sang "Published" trên website.

## 1. Yêu cầu cần thiết

Để tính năng này hoạt động, bạn cần có:
1.  **Facebook Page ID**: ID của Fanpage bạn muốn đăng bài.
2.  **Page Access Token**: Một token truy cập dài hạn (Long-lived Access Token) có quyền đăng bài lên Page.

## 2. Các bước lấy Token (Chuẩn chỉnh theo Meta 2026 - API v24.0)

### Bước 0: Đăng ký tài khoản Developer (Nếu chưa có)
Màn hình bạn đang thấy là bước đăng ký tài khoản, không phải tạo App.
1.  Tại mục **"Vai trò nào sau đây mô tả đúng nhất về bạn?"**, hãy chọn **Nhà phát triển** (Developer) hoặc **Chủ sở hữu/Người sáng lập**.
2.  Nhấn **Hoàn tất đăng ký**.

### Bước 1: Tạo Ứng dụng trên Meta for Developers
1.  Sau khi đăng ký xong, tại giao diện chính (nhấn **My Apps**), nhấn nút **Create App** (Tạo ứng dụng).
2.  Lúc này, Facebook sẽ hỏi bạn muốn dùng ứng dụng làm gì. Vì giao diện mới liên tục thay đổi, hãy tìm một trong hai tùy chọn sau (thường nằm ở dưới cùng):
    *   **"Tạo ứng dụng không có trường hợp sử dụng"** (Create app without use case) - *Biểu tượng hình tròn gạch chéo hoặc cây bút*.
    *   Hoặc **"Khác"** (Other) -> **"Tiếp"** -> Chọn **"Business"** (nếu có) hoặc chọn dòng có chữ **"legacy"** (trải nghiệm cũ).
    *   *Mục tiêu là tạo được một App trống để chúng ta tự thêm quyền.*
3.  Điền tên ứng dụng và email liên hệ.
4.  Nếu được hỏi chọn "Business Portfolio", bạn có thể bỏ qua hoặc chọn nếu đã có Business Manager.

### Bước 2: Thiết lập Facebook Login for Business
1.  Trong trang Dashboard ứng dụng, tìm sản phẩm **App settings**.
2.  Thêm **Facebook Login for Business**.

### Bước 3: Lấy Short-Lived Access Token
1.  Truy cập [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2.  Chọn App bạn vừa tạo.
3.  Trong phần **User or Page**, chọn **User Token**.
4.  Trong phần **Permissions**, thêm các quyền sau:
    *   `pages_manage_posts`
    *   `pages_read_engagement`
    *   `pages_show_list`
5.  Nhấn **Generate Access Token**.
6.  Xác nhận quyền truy cập với tài khoản Facebook của bạn.

### Bước 4: Lấy Page Access Token (Quan Trọng)
1.  Vẫn tại Graph API Explorer, đổi phương thức từ `GET` sang `GET` (mặc định).
2.  Nhập đường dẫn: `me/accounts`.
3.  Nhấn **Submit**.
4.  Bạn sẽ thấy danh sách các Page bạn quản lý. Tìm Page bạn muốn tích hợp.
5.  Copy đoạn mã trong trường `access_token` của Page đó. Đây là Token để đăng bài.

**⚠️ Không thấy Page của bạn?**
Nếu bạn không thấy Page mình cần, nguyên nhân thường là do lúc "Generate Access Token" ở **Bước 3.6**, bạn chưa cấp quyền cho Page đó.
**Cách fix:**
*   Nhấn lại vào nút **Generate Access Token** (User Token).
*   Tại mục **Permissions** (Quyền) ở cột bên phải, hãy gõ và thêm quyền **`business_management`**.
    *   *Lý do: Page nằm trong Business Manager bắt buộc phải có quyền này mới hiện ra.*
*   Nhấn **Generate Access Token** lại lần nữa.
*   Một cửa sổ popup sẽ hiện ra (hoặc nhấn "Edit Permissions" / "Re-connect").
*   Tại bước **"Select Pages"** (Chọn Trang), hãy đảm bảo **TÍCH CHỌN** vào Page bạn muốn quản lý. Nếu Page nằm trong Business Manager, hãy chọn Business đó.
*   Nhấn Tiếp tục -> Save.
*   Sau đó nhấn **Submit** lại ở thanh địa chỉ để tải lại danh sách `me/accounts`.

**Lưu ý:** Token này thường chỉ sống trong 1 giờ. Bạn cần đổi nó thành Long-Term Token để dùng lâu dài (60 ngày hoặc vĩnh viễn nếu cấu hình đúng System User).

### Cách đổi sang Long-Lived Token (Khuyên dùng):
Nếu bạn muốn hệ thống chạy ổn định lâu dài mà không phải thay token liên tục, hãy tạo một **System User** trong Business Manager.

**Trước tiên: Copy App ID và Thêm vào Business Manager**
*Lý do: App bạn tạo trên Developers và Business Manager là 2 nơi riêng biệt. Bạn phải kết nối chúng thủ công.*

1.  Truy cập lại [Meta for Developers](https://developers.facebook.com/apps/).
2.  Tìm ứng dụng bạn vừa tạo và **Copy dòng App ID** (ID Ứng dụng) - là dãy số dài.
3.  Quay lại trang cài đặt Business Manager (như ảnh bạn gửi).
    *   Vào mục **Tài khoản** (Accounts) -> **Ứng dụng** (Apps).
4.  Nhấn nút **+ Thêm** (Add) màu xanh dương.
5.  Chọn dòng **"Liên kết ID ứng dụng"** (Connect an App ID).
6.  Dán **App ID** bạn vừa copy vào và nhấn **Thêm ứng dụng**.
    *   *Lưu ý: Nếu Facebook báo lỗi chưa được xác minh, hãy đảm bảo bạn là Admin của cả App và Business Manager.*

**Tiếp theo: Tạo System User và Token**
1.  Vẫn trong Business Settings, chọn **Users** -> **System Users**.
2.  Thêm mới một System User (role Admin).
3.  **Quan trọng:** Nhấn nút **Add Assets** (Thêm tài sản).
    *   Chọn mục **Apps** -> Chọn App bạn vừa thêm >> Tích full quyền (Manage App).
    *   Chọn mục **Pages** -> Chọn Page bạn muốn đăng bài >> Tích full quyền.
    *   Lưu lại.
4.  Nhấn **Generate New Token**.
5.  Lúc này chọn App của bạn sẽ hiện ra.
6.  Chọn các quyền: `pages_manage_posts`, `pages_read_engagement`, `business_management`.
7.  Nhấn **Generate Token**. Token này sẽ vĩnh viễn không hết hạn.
8.  Copy Token này.

## 3. Cấu hình vào Website

Sau khi đã có **Page ID** và **Access Token**, bạn cần thêm chúng vào biến môi trường của dự án.

### 3.1. Cấu hình chạy Local (Trên máy tính của bạn)

1.  Mở dự án trong VS Code.
2.  Tìm file tên là `.env.local` ở thư mục gốc (nếu chưa có, hãy tạo mới file này).
3.  Thêm các dòng sau vào cuối file:

```env
# ID của Fanpage (Lấy từ URL của Page hoặc phần About)
FACEBOOK_PAGE_ID=1234567890

# Token vĩnh viễn bạn vừa tạo được ở bước trên
FACEBOOK_PAGE_ACCESS_TOKEN=EAAB...

# URL trang web của bạn (để tạo link bài viết khi đăng lên Facebook)
NEXT_PUBLIC_SITE_URL=https://signs.haus
```

4.  **Lưu file lại.**
5.  **Quan trọng:** Tắt server đang chạy (Ctrl + C) và chạy lại lệnh `npm run dev` để hệ thống nhận biến môi trường mới.

### 3.2. Cấu hình chạy Production (Trên Vercel)

Nếu web của bạn đang chạy trên Vercel, bạn cần thêm các biến này trên Dashboard của Vercel:

1.  Truy cập [Vercel Dashboard](https://vercel.com/dashboard).
2.  Chọn dự án **Signs-Haus**.
3.  Vào tab **Settings** -> chọn **Environment Variables** (cột bên trái).
4.  Thêm lần lượt 3 biến sau:
    *   **Ke:** `FACEBOOK_PAGE_ID` | **Value:** `1234567890...`
    *   **Key:** `FACEBOOK_PAGE_ACCESS_TOKEN` | **Value:** `EAAB...`
    *   **Key:** `NEXT_PUBLIC_SITE_URL` | **Value:** `https://signs.haus`
5.  Nhấn **Save**.
6.  **Redeploy:** Vào tab **Deployments**, chọn deploy gần nhất và nhấn **Redeploy** để áp dụng thay đổi mới này.

## 4. Kiểm tra hoạt động (Test)

1.  Vào trang Admin của website: `/admin/posts`.
2.  Tạo một bài viết mới (hoặc sửa bài cũ).
3.  Đổi trạng thái (Status) sang **Published**.
4.  Lưu lại.
5.  Kiểm tra Fanpage Facebook xem bài viết đã tự động xuất hiện chưa.

## 5. Cập nhật Cơ sở dữ liệu (Supabase)

Để hệ thống biết bài viết nào đã đăng rồi (tránh đăng lại nhiều lần), bạn cần thêm một cột `facebook_post_id` vào bảng `posts`.

Tôi đã chuẩn bị sẵn một công cụ tự động, bạn chỉ cần chạy link sau:

1.  **Chạy trên máy local:** Truy cập `http://localhost:3000/api/admin/migrate-v18`
2.  **Chạy trên Production:** Truy cập `https://signs.haus/api/admin/migrate-v18`

Nếu màn hình hiện thông báo thành công (success: true), nghĩa là Database của bạn đã sẵn sàng! Bạn không cần vào Supabase làm thủ công.
