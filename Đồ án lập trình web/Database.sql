-- Tạo database
CREATE DATABASE OnlineBookstore;
GO

USE OnlineBookstore;
GO

-- Bảng Người dùng
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(20),
    Address NVARCHAR(255),
    Role VARCHAR(20) CHECK (Role IN ('Customer', 'Admin')) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Bảng Danh mục
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(255) UNIQUE NOT NULL,
    ParentCategoryID INT NULL,
    FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID) ON DELETE NO ACTION
);

-- Bảng Tác giả
CREATE TABLE Authors (
    AuthorID INT IDENTITY(1,1) PRIMARY KEY,
    AuthorName NVARCHAR(255) NOT NULL,
    Bio TEXT
);

-- Bảng Nhà xuất bản
CREATE TABLE Publishers (
    PublisherID INT IDENTITY(1,1) PRIMARY KEY,
    PublisherName NVARCHAR(255) UNIQUE NOT NULL,
    Address NVARCHAR(255)
);

-- Bảng Sách
CREATE TABLE Books (
    BookID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    AuthorID INT NOT NULL,
    PublisherID INT NOT NULL,
    CategoryID INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    ISBN VARCHAR(20) UNIQUE NOT NULL,
    PublishedDate DATE,
    Description TEXT,
    CoverImage VARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID) ON DELETE CASCADE,
    FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID) ON DELETE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE CASCADE
);

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

-- Bảng Mã giảm giá
CREATE TABLE Discounts (
    DiscountID INT IDENTITY(1,1) PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    DiscountAmount DECIMAL(10,2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    UsageLimit INT DEFAULT 1
);

-- Bảng Đơn hàng
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    DiscountID INT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalPrice DECIMAL(10,2) NOT NULL,
    Status VARCHAR(20) CHECK (Status IN ('Pending', 'Shipped', 'Delivered', 'Canceled')) NOT NULL,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (DiscountID) REFERENCES Discounts(DiscountID) ON DELETE SET NULL
);

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

--Bảng Thanh toán
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    PaymentMethod VARCHAR(50) CHECK (PaymentMethod IN ('Credit Card', 'PayPal', 'MoMo', 'ZaloPay', 'Internet Banking', 'Cash On Delivery')) NOT NULL,
    PaymentStatus VARCHAR(20) CHECK (PaymentStatus IN ('Paid', 'Unpaid')) NOT NULL,
    TransactionID VARCHAR(100) UNIQUE,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);

-- Bảng Đánh giá sách
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5) NOT NULL,
    Comment TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE
);

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
    FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID) ON DELETE NO ACTION -- ❌ Tránh lỗi vòng lặp
);

GO

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
        RAISERROR ('Lỗi: Không thể tạo vòng lặp trong danh mục.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO
