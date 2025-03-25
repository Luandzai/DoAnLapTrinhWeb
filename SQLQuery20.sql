CREATE DATABASE ONLINEBOOKSTORE
go
use ONLINEBOOKSTORE
go

-- Bảng Người dùng
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(255),
    Role NVARCHAR(20) CHECK (Role IN (N'Customer', N'Admin')) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
go
-- Bảng Danh mục
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(255) UNIQUE NOT NULL,
    ParentCategoryID INT NULL,
    FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID) ON DELETE NO ACTION
);
go
-- Bảng Tác giả
CREATE TABLE Authors (
    AuthorID INT IDENTITY(1,1) PRIMARY KEY,
    AuthorName NVARCHAR(255) NOT NULL,
    Bio NVARCHAR(MAX)
);
go
-- Bảng Nhà xuất bản
CREATE TABLE Publishers (
    PublisherID INT IDENTITY(1,1) PRIMARY KEY,
    PublisherName NVARCHAR(255) UNIQUE NOT NULL,
    Address NVARCHAR(255)
);
go
-- Bảng Sách
CREATE TABLE Books (
    BookID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    AuthorID INT NOT NULL,
    PublisherID INT NOT NULL,
    CategoryID INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    OldPrice DECIMAL(10,2) NOT NULL, 
    DiscountPrice DECIMAL(10,2),
    SoldQuantity INT DEFAULT 0,
    StockQuantity INT DEFAULT 0,
    ISBN NVARCHAR(20) UNIQUE NOT NULL,
    PublishedDate DATE,
    Description NVARCHAR(MAX),
    CoverImage NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID) ON DELETE CASCADE,
    FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID) ON DELETE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE CASCADE
);
go
-- Bảng Giỏ hàng
CREATE TABLE Cart (
    CartID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);
go
-- Bảng Mã giảm giá
CREATE TABLE Discounts (
    DiscountID INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) UNIQUE NOT NULL,
    DiscountAmount DECIMAL(10,2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    UsageLimit INT DEFAULT 1
);
go
-- Bảng Đơn hàng
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    DiscountID INT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalPrice DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20) CHECK (Status IN (N'Pending', N'Shipped', N'Delivered', N'Canceled')) NOT NULL,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (DiscountID) REFERENCES Discounts(DiscountID) ON DELETE SET NULL
);
go
-- Bảng Chi tiết đơn hàng
CREATE TABLE OrderDetails (
    OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    BookID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);
go
--Bảng Thanh toán
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    PaymentMethod NVARCHAR(50) CHECK (PaymentMethod IN (N'Credit Card', N'PayPal', N'MoMo', N'ZaloPay', N'Internet Banking', N'Cash On Delivery')) NOT NULL,
    PaymentStatus NVARCHAR(20) CHECK (PaymentStatus IN (N'Paid', N'Unpaid')) NOT NULL,
    TransactionID NVARCHAR(100) UNIQUE,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);
go
-- Bảng Đánh giá sách
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5) NOT NULL,
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);
go
-- Bảng Lịch sử giao dịch
CREATE TABLE Transactions (
    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL, -- Cho phép NULL nếu User bị xóa
    OrderID INT NOT NULL,
    PaymentID INT NULL, -- Giữ nguyên nhưng không dùng ON DELETE SET NULL
    Amount DECIMAL(10,2) NOT NULL,
    TransactionDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE NO ACTION,
    FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID) ON DELETE NO ACTION 
);
go

CREATE TABLE UserDiscounts (
    UserDiscountID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    DiscountID INT NOT NULL,
    IsUsed BIT DEFAULT 0, -- 0: chưa dùng, 1: đã dùng
    AssignedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (DiscountID) REFERENCES Discounts(DiscountID) ON DELETE CASCADE
);
Go

-- ✅ Cập nhật Trigger kiểm tra vòng lặp danh mục
CREATE TRIGGER PreventCategoryLoop
ON Categories
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Dùng biến kiểm tra vòng lặp
    DECLARE @LoopExists INT = 0;

    -- Dùng CTE để kiểm tra vòng lặp từ dữ liệu mới được thêm/cập nhật
    WITH RecursiveCTE AS (
        SELECT i.CategoryID, i.ParentCategoryID 
        FROM inserted i
        UNION ALL
        SELECT c.CategoryID, p.ParentCategoryID
        FROM Categories c
        JOIN RecursiveCTE p ON c.ParentCategoryID = p.CategoryID
    )
    SELECT TOP 1 @LoopExists = 1 FROM RecursiveCTE WHERE CategoryID = ParentCategoryID;

    -- Nếu phát hiện vòng lặp, rollback giao dịch
    IF @LoopExists = 1
    BEGIN
        RAISERROR (N'Lỗi: Không thể tạo vòng lặp trong danh mục.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

INSERT INTO Users (FullName, Email, PasswordHash, PhoneNumber, Address, Role) VALUES
(N'Nguyễn Văn A', 'nguyenvana@gmail.com', 'hashed_password_1', '0987654321', N'123 Lê Lợi, Quận 1, TP.HCM', 'Customer'),
(N'Trần Thị B', 'tranthib@gmail.com', 'hashed_password_2', '0912345678', N'45 Hai Bà Trưng, Quận 3, TP.HCM', 'Customer'),
(N'Admin C', 'admin@gmail.com', 'hashed_password_3', '0909090909', N'Admin Office', 'Admin');

select * from users

INSERT INTO Categories (CategoryName, ParentCategoryID) VALUES
(N'Văn học', NULL),
(N'Kinh tế', NULL),
(N'Công nghệ', NULL),
(N'Khoa học', NULL),
(N'Lịch sử', NULL);

SELECT * FROM Categories;

INSERT INTO Categories (CategoryName, ParentCategoryID) VALUES
(N'Tiểu thuyết', 1),      -- Thuộc "Văn học"
(N'Truyện ngắn', 1),      -- Thuộc "Văn học"
(N'Quản trị kinh doanh', 2),  -- Thuộc "Kinh tế"
(N'Đầu tư tài chính', 2),     -- Thuộc "Kinh tế"
(N'Lập trình', 3),        -- Thuộc "Công nghệ"
(N'Trí tuệ nhân tạo', 3), -- Thuộc "Công nghệ"
(N'Vật lý', 4),           -- Thuộc "Khoa học"
(N'Chiến tranh thế giới', 5); -- Thuộc "Lịch sử"

SELECT * FROM Categories;

INSERT INTO Authors (AuthorName, Bio) VALUES
(N'Nguyễn Nhật Ánh', N'Tác giả nổi tiếng với các tác phẩm văn học dành cho tuổi trẻ.'),
(N'J.K. Rowling', N'Tác giả của bộ truyện Harry Potter.'),
(N'Dale Carnegie', N'Chuyên gia phát triển bản thân và giao tiếp.');

SELECT * FROM Authors;

INSERT INTO Publishers (PublisherName, Address) VALUES
(N'NXB Trẻ', N'12 Nguyễn Thị Minh Khai, TP.HCM'),
(N'NXB Kim Đồng', N'45 Lý Tự Trọng, Hà Nội'),
(N'NXB Lao Động', N'78 Hoàng Diệu, Đà Nẵng');

SELECT * FROM Publishers;


INSERT INTO Books (Title, AuthorID, PublisherID, CategoryID, Price, OldPrice, DiscountPrice, SoldQuantity, StockQuantity, ISBN, PublishedDate, Description, CoverImage, CreatedAt, UpdatedAt) VALUES
-- 📖 Văn học
(N'Nhà giả kim', 1, 1, 1, 99000, 129000, 89000, 500, 100, '9786041123456', '2000-07-01', N'Một cuốn sách truyền cảm hứng về hành trình tìm kiếm ước mơ.', 'nha_gia_kim.jpg', GETDATE(), GETDATE()),
(N'To Kill a Mockingbird', 2, 2, 2, 120000, 150000, NULL, 320, 80, '9780061120084', '1960-07-11', N'Một câu chuyện xúc động về phân biệt chủng tộc và lòng dũng cảm.', 'mockingbird.jpg', GETDATE(), GETDATE()),
(N'Bố Già', 3, 3, 3, 150000, 180000, 140000, 450, 120, '9786041145678', '1969-03-10', N'Tiểu thuyết kinh điển về thế giới mafia Mỹ.', 'bo_gia.jpg', GETDATE(), GETDATE()),
(N'Chiến binh cầu vồng', 1, 1, 4, 100000, 130000, NULL, 280, 90, '9786041178902', '2005-09-20', N'Câu chuyện về những đứa trẻ đầy nghị lực vươn lên từ khó khăn.', 'chien_binh_cau_vong.jpg', GETDATE(), GETDATE()),

-- 📈 Kinh tế
(N'Cha giàu cha nghèo', 2, 2, 5, 99000, 129000, 95000, 700, 50, '9786041189001', '1997-04-11', N'Bài học tài chính cá nhân quan trọng.', 'cha_giau_cha_ngheo.jpg', GETDATE(), GETDATE()),
(N'Người giàu có nhất thành Babylon', 3, 3, 6, 89000, 120000, NULL, 420, 60, '9786041189202', '1926-08-01', N'Những nguyên tắc tài chính bất hủ từ Babylon.', 'babylon.jpg', GETDATE(), GETDATE()),
(N'Bí mật tư duy triệu phú', 1, 1, 7, 125000, 160000, 115000, 390, 40, '9786041199999', '2005-06-15', N'Tư duy tài chính giúp bạn làm giàu hiệu quả.', 'bi_mat_tu_duy.jpg', GETDATE(), GETDATE()),

-- 💻 Công nghệ
(N'Lập trình C++ từ cơ bản đến nâng cao', 2, 2, 8, 159000, 190000, 149000, 250, 30, '9786041309876', '2018-09-30', N'Tài liệu học lập trình C++ chi tiết.', 'cpp_book.jpg', GETDATE(), GETDATE()),
(N'Trí tuệ nhân tạo và ứng dụng', 3, 3, 9, 189000, 220000, 179000, 220, 20, '9786041323456', '2021-04-20', N'Tìm hiểu về AI và ứng dụng thực tế.', 'ai_book.jpg', GETDATE(), GETDATE()),
(N'Python cho người mới bắt đầu', 1, 1, 10, 129000, 150000, 119000, 310, 50, '9786041334567', '2019-07-15', N'Hướng dẫn học Python từ căn bản.', 'python_book.jpg', GETDATE(), GETDATE()),

-- 🔬 Khoa học
(N'Vũ trụ trong vỏ hạt dẻ', 2, 2, 11, 135000, 170000, 125000, 280, 40, '9786041345678', '2001-11-05', N'Khám phá vũ trụ cùng Stephen Hawking.', 'vu_tru_hat_de.jpg', GETDATE(), GETDATE()),
(N'Lược sử thời gian', 3, 3, 12, 120000, 150000, NULL, 450, 35, '9786041356789', '1988-06-01', N'Tìm hiểu về vật lý hiện đại.', 'luoc_su_thoi_gian.jpg', GETDATE(), GETDATE()),
(N'Hành trình về phương Đông', 1, 1, 13, 99000, 125000, 90000, 500, 60, '9786041367890', '1924-09-10', N'Một cuộc hành trình khám phá tâm linh.', 'hanh_trinh_phuong_dong.jpg', GETDATE(), GETDATE()),

-- 🏛️ Lịch sử
(N'Lịch sử thế giới', 2, 2, 1, 180000, 220000, 165000, 300, 45, '9786041378901', '2015-03-15', N'Cuốn sách tổng hợp lịch sử thế giới qua các thời kỳ.', 'lich_su_the_gioi.jpg', GETDATE(), GETDATE()),
(N'Chiến tranh thế giới thứ hai', 3, 3, 2, 210000, 250000, 195000, 220, 30, '9786041389012', '2009-07-22', N'Thông tin chi tiết về Thế Chiến II.', 'chien_tranh_the_gioi.jpg', GETDATE(), GETDATE()),

-- 📚 Một số cuốn khác
(N'Tâm lý học tội phạm', 1, 1, 3, 150000, 180000, NULL, 190, 40, '9786041390123', '2010-11-11', N'Nghiên cứu về tâm lý tội phạm.', 'tam_ly_to_pham.jpg', GETDATE(), GETDATE()),
(N'Cuộc cách mạng công nghiệp 4.0', 2, 2, 4, 175000, 200000, 165000, 270, 25, '9786041401234', '2018-12-01', N'Cách mạng công nghệ và tác động của nó.', 'cach_mang_4.0.jpg', GETDATE(), GETDATE());



SELECT * FROM Books;

INSERT INTO Cart (UserID, BookID, Quantity) VALUES
(1, 16, 2),
(2, 7, 1),
(1, 20, 1);

INSERT INTO Discounts (Code, DiscountAmount, StartDate, EndDate, UsageLimit) VALUES
('SUMMER2025', 50000, '2025-06-01', '2025-07-01', 100),
('WELCOME10', 100000, '2025-03-01', '2025-12-31', 50);

SELECT * FROM Discounts;

INSERT INTO Orders (UserID, DiscountID, TotalPrice, Status) VALUES
(1, 1, 240000, 'Pending'),
(2, 2, 200000, 'Shipped');

SELECT * FROM Orders;

INSERT INTO OrderDetails (OrderID, BookID, Quantity, UnitPrice) VALUES
(1, 20, 2, 100000),
(2, 17, 1, 200000);

INSERT INTO Payments (OrderID, PaymentMethod, PaymentStatus, TransactionID) VALUES
(1, 'MoMo', 'Paid', 'MOMO123456'),
(2, 'Credit Card', 'Paid', 'CC987654');

SELECT * FROM Payments;

INSERT INTO Reviews (UserID, BookID, Rating, Comment) VALUES
(1, 8, 5, N'Tuyệt vời! Một cuốn sách rất hay.'),
(2, 21, 4, N'Hay nhưng hơi dài.'),
(1, 19, 5, N'Một cuốn sách kinh điển.');

INSERT INTO Transactions (UserID, OrderID, PaymentID, Amount) VALUES
(1, 2, 1, 240000),
(2, 1, 2, 200000);


INSERT INTO Books (Title, AuthorID, PublisherID, CategoryID, Price, OldPrice, DiscountPrice, SoldQuantity, StockQuantity, ISBN, PublishedDate, Description, CoverImage, CreatedAt, UpdatedAt) VALUES
-- 📖 Văn học
(N'Ánh Đèn Rực Rỡ', 1, 1, 1, 105000, 135000, 95000, 420, 85, '9786041501234', '2010-05-15', N'Câu chuyện về một gia đình vượt qua khó khăn trong chiến tranh.', 'anh_den_ruc_ro.jpg', '2023-01-01 10:00:00', '2023-01-02 12:00:00'),
(N'Hương Phù Sa', 2, 2, 2, 130000, 160000, 120000, 380, 70, '9786041502345', '1995-08-20', N'Tiểu thuyết về tình yêu quê hương và ký ức tuổi thơ.', 'huong_phu_sa.jpg', '2023-02-01 10:00:00', '2023-02-02 12:00:00'),
(N'Cánh Đồng Vô Tận', 3, 3, 3, 140000, 170000, 130000, 500, 90, '9786041503456', '2008-03-10', N'Hành trình tìm lại chính mình giữa những biến cố cuộc đời.', 'canh_dong_vo_tan.jpg', '2023-03-01 10:00:00', '2023-03-02 12:00:00'),
(N'Mùa Hè Không Tên', 1, 1, 4, 95000, 125000, 85000, 300, 60, '9786041504567', '2015-07-25', N'Tuổi trẻ đầy nhiệt huyết và những giấc mơ chưa thành.', 'mua_he_khong_ten.jpg', '2023-04-01 10:00:00', '2023-04-02 12:00:00'),

-- 📈 Kinh tế
(N'Tiền Đẻ Ra Tiền', 2, 2, 5, 110000, 140000, 100000, 600, 55, '9786041505678', '2012-11-30', N'Bí quyết đầu tư thông minh để gia tăng tài sản.', 'tien_de_ra_tien.jpg', '2023-05-01 10:00:00', '2023-05-02 12:00:00'),
(N'Kinh Tế Học Hài Hước', 3, 3, 6, 120000, 150000, 110000, 350, 65, '9786041506789', '2007-09-15', N'Giải thích các khái niệm kinh tế qua lăng kính hài hước.', 'kinh_te_hai_huoc.jpg', '2023-06-01 10:00:00', '2023-06-02 12:00:00'),
(N'Tăng Tốc Đến Thành Công', 1, 1, 7, 135000, 165000, 125000, 400, 50, '9786041507890', '2019-04-10', N'Chiến lược phát triển bản thân trong thời đại số.', 'tang_toc_thanh_cong.jpg', '2023-07-01 10:00:00', '2023-07-02 12:00:00'),

-- 💻 Công nghệ
(N'Học SQL Trong 24 Giờ', 2, 2, 8, 145000, 175000, 135000, 220, 35, '9786041508901', '2020-06-05', N'Hướng dẫn học SQL nhanh chóng và hiệu quả.', 'sql_24h.jpg', '2023-08-01 10:00:00', '2023-08-02 12:00:00'),
(N'Blockchain Từ A Đến Z', 3, 3, 9, 195000, 230000, 185000, 200, 25, '9786041509012', '2021-08-15', N'Tìm hiểu công nghệ blockchain và ứng dụng thực tiễn.', 'blockchain_a_z.jpg', '2023-09-01 10:00:00', '2023-09-02 12:00:00'),
(N'Học Lập Trình Web Với HTML & CSS', 1, 1, 10, 125000, 155000, 115000, 280, 45, '9786041509123', '2018-12-20', N'Cẩm nang thiết kế web cho người mới bắt đầu.', 'html_css.jpg', '2023-10-01 10:00:00', '2023-10-02 12:00:00'),

-- 🔬 Khoa học
(N'Bí Ẩn Dưới Đại Dương', 2, 2, 11, 140000, 170000, 130000, 310, 50, '9786041509234', '2016-02-18', N'Khám phá thế giới sinh vật biển đầy kỳ thú.', 'bi_an_duoi_dai_duong.jpg', '2023-11-01 10:00:00', '2023-11-02 12:00:00'),
(N'Thuyết Tương Đối Dễ Hiểu', 3, 3, 12, 115000, 145000, 105000, 470, 40, '9786041509345', '2014-05-22', N'Giải thích thuyết tương đối của Einstein một cách đơn giản.', 'thuyet_tuong_doi.jpg', '2023-12-01 10:00:00', '2023-12-02 12:00:00'),
(N'Khám Phá Hệ Mặt Trời', 1, 1, 13, 100000, 130000, 90000, 520, 70, '9786041509456', '2017-09-30', N'Hành trình khám phá các hành tinh trong hệ mặt trời.', 'kham_pha_he_mat_troi.jpg', '2024-01-01 10:00:00', '2024-01-02 12:00:00'),

-- 🏛️ Lịch sử
(N'Vương Triều Cuối Cùng', 2, 2, 1, 185000, 225000, 170000, 290, 55, '9786041509567', '2013-01-12', N'Lịch sử triều đại phong kiến cuối cùng của Việt Nam.', 'vuong_trieu_cuoi_cung.jpg', '2024-02-01 10:00:00', '2024-02-02 12:00:00'),
(N'Cuộc Chiến 100 Năm', 3, 3, 2, 215000, 255000, 200000, 230, 35, '9786041509678', '2011-06-08', N'Phân tích cuộc chiến tranh kéo dài 100 năm ở châu Âu.', 'cuoc_chien_100_nam.jpg', '2024-03-01 10:00:00', '2024-03-02 12:00:00'),

-- 📚 Một số cuốn khác
(N'Tư Duy Phản Biện', 1, 1, 3, 155000, 185000, 145000, 210, 45, '9786041509789', '2019-10-15', N'Rèn luyện kỹ năng tư duy phản biện trong cuộc sống.', 'tu_duy_phan_bien.jpg', '2024-04-01 10:00:00', '2024-04-02 12:00:00'),
(N'Thời Đại Công Nghệ Số', 2, 2, 4, 165000, 195000, 155000, 250, 30, '9786041509890', '2020-11-20', N'Tác động của công nghệ số đến xã hội hiện đại.', 'thoi_dai_cong_nghe_so.jpg', '2024-05-01 10:00:00', '2024-05-02 12:00:00');


