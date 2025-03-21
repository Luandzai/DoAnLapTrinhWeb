-- Bảng Users (Chỉ có Admin và Customer)
INSERT INTO Users (FullName, Email, PasswordHash, PhoneNumber, Address, Role)
VALUES 
('Nguyễn Văn A', 'nguyenvana@example.com', 'hashed_password_123', '0901234567', 'Hà Nội', 'Admin'),
('Trần Thị B', 'tranthib@example.com', 'hashed_password_456', '0912345678', 'Hồ Chí Minh', 'Customer'),
('Lê Văn C', 'levanc@example.com', 'hashed_password_789', '0923456789', 'Đà Nẵng', 'Customer');

-- Bảng Categories
INSERT INTO Categories (CategoryName, ParentCategoryID)
VALUES 
('Sách Khoa Học', NULL),
('Sách Văn Học', NULL),
('Sách Kinh Tế', NULL),
('Sách Lập Trình', NULL),
('Sách Giáo Khoa', NULL);

INSERT INTO Categories (CategoryName, ParentCategoryID)  
VALUES   
    -- Danh mục con của Khoa Học  
    ('Vật Lý', 1),  
    ('Hóa Học', 1),  
    ('Sinh Học', 1),  
    -- Danh mục con của Văn Học  
    ('Tiểu Thuyết', 2),  
    ('Truyện Ngắn', 2),  
    ('Tiểu Thuyết Ngôn Tình', 2),  
    ('Tiểu Thuyết Đam Mỹ', 2),  
    ('Truyện Nam Sinh', 2),  
    ('Manga', 2),  
    ('Manhua', 2),  
    ('Light Novel', 2),  
    -- Danh mục con của Kinh Tế  
    ('Quản Trị Kinh Doanh', 3),  
    ('Tài Chính - Đầu Tư', 3),  
    -- Danh mục con của Lập Trình  
    ('Lập Trình Web', 4),  
    ('Lập Trình Python', 4),  
    ('Lập Trình Java', 4),  
    ('Lập Trình C++', 4),  
    -- Danh mục con của Giáo Khoa  
    ('Sách Toán', 5),  
    ('Sách Ngữ Văn', 5),  
    ('Sách Tiếng Anh', 5);  

-- Bảng Authors
INSERT INTO Authors (AuthorName, Bio)
VALUES 
('Stephen Hawking', 'Nhà vật lý lý thuyết nổi tiếng.'),
('J.K. Rowling', 'Tác giả của loạt truyện Harry Potter.'),
('Robert C. Martin', 'Chuyên gia lập trình, tác giả của Clean Code.'),
('Dale Carnegie', 'Tác giả nổi tiếng về sách kỹ năng sống.'),
('Yuval Noah Harari', 'Tác giả của Homo Deus và Sapiens.');

-- Bảng Publishers
INSERT INTO Publishers (PublisherName, Address)
VALUES 
('Nhà xuất bản Kim Đồng', 'Hà Nội'),
('Nhà xuất bản Trẻ', 'Hồ Chí Minh'),
('Nhà xuất bản Khoa Học', 'Đà Nẵng'),
('Nhà xuất bản Lao Động', 'Hà Nội'),
('Nhà xuất bản Kinh Tế', 'TP. HCM');

-- Bảng Books (Thêm nhiều sách hơn)
INSERT INTO Books (Title, AuthorID, PublisherID, CategoryID, Price, StockQuantity, ISBN, PublishedDate, Description, CoverImage)
VALUES 
('Lược Sử Thời Gian', 1, 3, 1, 150000, 50, '978-6042100352', '1988-04-01', 'Một cuốn sách khoa học nổi tiếng.', 'cover1.jpg'),
('Harry Potter và Hòn Đá Phù Thủy', 2, 1, 2, 200000, 100, '978-0439708180', '1997-06-26', 'Cuốn sách mở đầu cho series Harry Potter.', 'cover2.jpg'),
('Clean Code', 3, 2, 4, 300000, 30, '978-0132350884', '2008-08-01', 'Cuốn sách dành cho lập trình viên.', 'cover3.jpg'),
('Đắc Nhân Tâm', 4, 4, 3, 120000, 70, '978-6042040001', '1936-01-01', 'Sách kỹ năng sống kinh điển.', 'cover4.jpg'),
('Sapiens: Lược sử loài người', 5, 5, 1, 250000, 40, '978-0062316097', '2011-06-01', 'Câu chuyện tiến hóa của loài người.', 'cover5.jpg');

-- Bảng Cart
INSERT INTO Cart (UserID, BookID, Quantity)
VALUES 
(2, 1, 2),
(2, 2, 1),
(3, 3, 3),
(3, 5, 1);

-- Bảng Discounts
INSERT INTO Discounts (Code, DiscountAmount, StartDate, EndDate, UsageLimit)
VALUES 
('SALE10', 10000, '2025-01-01', '2025-12-31', 10),
('FREESHIP', 5000, '2025-03-01', '2025-06-30', 5),
('DISCOUNT15', 15000, '2025-02-01', '2025-10-31', 8);

-- Bảng Orders
INSERT INTO Orders (UserID, DiscountID, TotalPrice, Status)
VALUES 
(2, 1, 290000, 'Pending'),
(3, NULL, 900000, 'Shipped'),
(2, 2, 150000, 'Delivered');

-- Bảng OrderDetails
INSERT INTO OrderDetails (OrderID, BookID, Quantity, UnitPrice)
VALUES 
(1, 1, 2, 150000),
(1, 2, 1, 200000),
(2, 3, 3, 300000),
(3, 4, 1, 120000);

-- Bảng Payments (Thêm nhiều phương thức thanh toán)
INSERT INTO Payments (OrderID, PaymentMethod, PaymentStatus, TransactionID)
VALUES 
(1, 'Credit Card', 'Paid', 'TXN12345'),
(2, 'PayPal', 'Paid', 'TXN67890'),
(3, 'MoMo', 'Paid', 'TXN98765'),
(3, 'ZaloPay', 'Unpaid', NULL),
(1, 'Internet Banking', 'Paid', 'TXN54321');

-- Bảng Reviews
INSERT INTO Reviews (UserID, BookID, Rating, Comment)
VALUES 
(2, 1, 5, 'Cuốn sách hay và bổ ích.'),
(2, 2, 4, 'Truyện hấp dẫn.'),
(3, 3, 5, 'Sách rất hữu ích cho lập trình viên.'),
(3, 4, 4, 'Sách hay nhưng bìa hơi cũ.'),
(2, 5, 5, 'Cực kỳ hay và dễ hiểu.');

-- Bảng Transactions
INSERT INTO Transactions (UserID, OrderID, PaymentID, Amount)
VALUES 
(2, 1, 1, 290000),
(3, 2, 2, 900000),
(2, 3, 3, 150000);

-- Kiểm tra danh sách người dùng (Admin & Customer)
SELECT * FROM Users;

-- Kiểm tra danh mục sách
SELECT * FROM Categories;

-- Kiểm tra tác giả
SELECT * FROM Authors;

-- Kiểm tra nhà xuất bản
SELECT * FROM Publishers;

-- Kiểm tra danh sách sách
SELECT * FROM Books;

-- Kiểm tra giỏ hàng (Sách nào đang trong giỏ hàng của ai)
SELECT * FROM Cart;

-- Kiểm tra mã giảm giá
SELECT * FROM Discounts;

-- Kiểm tra danh sách đơn hàng
SELECT * FROM Orders;

-- Kiểm tra chi tiết đơn hàng (Mỗi đơn hàng có những sách nào)
SELECT * FROM OrderDetails;

-- Kiểm tra danh sách thanh toán
SELECT * FROM Payments;

-- Kiểm tra lịch sử đánh giá sách
SELECT * FROM Reviews;

-- Kiểm tra lịch sử giao dịch
SELECT * FROM Transactions;

-- Kiểm tra xem có đơn hàng nào tham chiếu sai UserID không?
SELECT * FROM Orders WHERE UserID NOT IN (SELECT UserID FROM Users);

-- Kiểm tra xem có sách nào tham chiếu sai CategoryID không?
SELECT * FROM Books WHERE CategoryID NOT IN (SELECT CategoryID FROM Categories);

-- Kiểm tra xem có sách nào tham chiếu sai AuthorID không?
SELECT * FROM Books WHERE AuthorID NOT IN (SELECT AuthorID FROM Authors);

-- Kiểm tra xem có sách nào tham chiếu sai PublisherID không?
SELECT * FROM Books WHERE PublisherID NOT IN (SELECT PublisherID FROM Publishers);

-- Kiểm tra xem có giỏ hàng nào tham chiếu sai UserID không?
SELECT * FROM Cart WHERE UserID NOT IN (SELECT UserID FROM Users);

-- Kiểm tra xem có giỏ hàng nào tham chiếu sai BookID không?
SELECT * FROM Cart WHERE BookID NOT IN (SELECT BookID FROM Books);

-- Kiểm tra xem có đơn hàng nào tham chiếu sai DiscountID không?
SELECT * FROM Orders WHERE DiscountID IS NOT NULL AND DiscountID NOT IN (SELECT DiscountID FROM Discounts);

-- Kiểm tra xem có chi tiết đơn hàng nào tham chiếu sai OrderID không?
SELECT * FROM OrderDetails WHERE OrderID NOT IN (SELECT OrderID FROM Orders);

-- Kiểm tra xem có chi tiết đơn hàng nào tham chiếu sai BookID không?
SELECT * FROM OrderDetails WHERE BookID NOT IN (SELECT BookID FROM Books);

-- Kiểm tra xem có thanh toán nào tham chiếu sai OrderID không?
SELECT * FROM Payments WHERE OrderID NOT IN (SELECT OrderID FROM Orders);

-- Kiểm tra xem có đánh giá nào tham chiếu sai UserID không?
SELECT * FROM Reviews WHERE UserID NOT IN (SELECT UserID FROM Users);

-- Kiểm tra xem có đánh giá nào tham chiếu sai BookID không?
SELECT * FROM Reviews WHERE BookID NOT IN (SELECT BookID FROM Books);

-- Kiểm tra xem có giao dịch nào tham chiếu sai UserID không?
SELECT * FROM Transactions WHERE UserID NOT IN (SELECT UserID FROM Users);

-- Kiểm tra xem có giao dịch nào tham chiếu sai OrderID không?
SELECT * FROM Transactions WHERE OrderID NOT IN (SELECT OrderID FROM Orders);

-- Kiểm tra xem có giao dịch nào tham chiếu sai PaymentID không?
SELECT * FROM Transactions WHERE PaymentID NOT IN (SELECT PaymentID FROM Payments);

-- Kiểm tra xem có User nào bị thiếu email không?
SELECT * FROM Users WHERE Email IS NULL;

-- Kiểm tra xem có sách nào bị thiếu giá bán không?
SELECT * FROM Books WHERE Price IS NULL;

-- Kiểm tra xem có đơn hàng nào bị thiếu trạng thái không?
SELECT * FROM Orders WHERE Status IS NULL;

-- Kiểm tra xem có thanh toán nào bị thiếu phương thức không?
SELECT * FROM Payments WHERE PaymentMethod IS NULL;

-- Kiểm tra xem có email người dùng nào bị trùng không?
SELECT Email, COUNT(*) AS DuplicateCount FROM Users GROUP BY Email HAVING COUNT(*) > 1;

-- Kiểm tra xem có sách nào bị trùng ISBN không?
SELECT ISBN, COUNT(*) AS DuplicateCount FROM Books GROUP BY ISBN HAVING COUNT(*) > 1;

-- Kiểm tra xem có mã giảm giá nào bị trùng không?
SELECT Code, COUNT(*) AS DuplicateCount FROM Discounts GROUP BY Code HAVING COUNT(*) > 1;

SELECT 'Users' AS TableName, COUNT(*) AS TotalRecords FROM Users
UNION ALL
SELECT 'Categories', COUNT(*) FROM Categories
UNION ALL
SELECT 'Authors', COUNT(*) FROM Authors
UNION ALL
SELECT 'Publishers', COUNT(*) FROM Publishers
UNION ALL
SELECT 'Books', COUNT(*) FROM Books
UNION ALL
SELECT 'Cart', COUNT(*) FROM Cart
UNION ALL
SELECT 'Discounts', COUNT(*) FROM Discounts
UNION ALL
SELECT 'Orders', COUNT(*) FROM Orders
UNION ALL
SELECT 'OrderDetails', COUNT(*) FROM OrderDetails
UNION ALL
SELECT 'Payments', COUNT(*) FROM Payments
UNION ALL
SELECT 'Reviews', COUNT(*) FROM Reviews
UNION ALL
SELECT 'Transactions', COUNT(*) FROM Transactions;
