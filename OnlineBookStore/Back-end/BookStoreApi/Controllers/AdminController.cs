using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookStoreApi.Models;
using System.Threading.Tasks;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public AdminController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // GET: api/admin/dashboard?userId={userId}
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats(int userId)
        {
            // Kiểm tra userId và role
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "Người dùng không tồn tại." });
            }
            if (user.Role != "Admin")
            {
                return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
            }

            try
            {
                var stats = new
                {
                    TotalRevenue = await _context.Orders
                        .Where(o => o.Status == "Delivered")
                        .SumAsync(o => o.TotalPrice), // Chỉ lấy TotalPrice
                    TotalOrders = await _context.Orders.CountAsync(),
                    TotalUsers = await _context.Users
                        .CountAsync(u => u.Role == "Customer"),
                    PendingOrders = await _context.Orders
                        .CountAsync(o => o.Status == "Pending")
                };

                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        [HttpGet("books")]
        public async Task<IActionResult> GetBooks([FromQuery] string? search, [FromQuery] string? categoryId)
        {
            var query = _context.Books
                .Include(b => b.Author)
                .Include(b => b.Publisher)
                .Include(b => b.Category)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(b => b.Title.Contains(search));
            }

            if (!string.IsNullOrEmpty(categoryId))
            {
                var categoryIds = categoryId.Split(',').Select(int.Parse).ToList();
                query = query.Where(b => categoryIds.Contains(b.CategoryId));
            }

            var books = await query
                .Select(b => new
                {
                    b.BookId,
                    b.Title,
                    b.Price,
                    b.OldPrice,
                    b.DiscountPrice,
                    CoverImage = b.CoverImage != null ? $"{Request.Scheme}://{Request.Host}/images/{b.CoverImage}" : null,
                    b.SoldQuantity,
                    b.StockQuantity,
                    AuthorName = b.Author.AuthorName,
                    PublisherName = b.Publisher.PublisherName,
                    CategoryName = b.Category.CategoryName,
                    b.CreatedAt,
                    b.UpdatedAt
                })
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return Ok(new { success = true, value = books });
        }

        [HttpPost("books")]
        public async Task<IActionResult> CreateBook([FromForm] BookCreateDto bookDto)
        {
            try
            {
                // Kiểm tra dữ liệu đầu vào
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });
                }

                // Kiểm tra sự tồn tại của Author, Publisher, Category
                var author = await _context.Authors.FindAsync(bookDto.AuthorId);
                var publisher = await _context.Publishers.FindAsync(bookDto.PublisherId);
                var category = await _context.Categories.FindAsync(bookDto.CategoryId);

                if (author == null || publisher == null || category == null)
                {
                    return BadRequest(new { success = false, message = "Tác giả, nhà xuất bản hoặc danh mục không tồn tại." });
                }

                // Tạo đối tượng Book từ DTO
                var book = new Book
                {
                    Title = bookDto.Title,
                    AuthorId = bookDto.AuthorId,
                    PublisherId = bookDto.PublisherId,
                    CategoryId = bookDto.CategoryId,
                    Price = bookDto.Price,
                    OldPrice = bookDto.OldPrice,
                    DiscountPrice = bookDto.DiscountPrice,
                    StockQuantity = bookDto.StockQuantity,
                    Isbn = bookDto.Isbn,
                    PublishedDate = bookDto.PublishedDate,
                    Description = bookDto.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Xử lý upload ảnh bìa (nếu có)
                if (bookDto.CoverImage != null && bookDto.CoverImage.Length > 0)
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(bookDto.CoverImage.FileName);
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "images", fileName);

                    // Đảm bảo thư mục images tồn tại
                    Directory.CreateDirectory(Path.GetDirectoryName(filePath));

                    // Lưu file ảnh
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await bookDto.CoverImage.CopyToAsync(stream);
                    }
                    book.CoverImage = fileName;
                }

                // Thêm sách vào database
                _context.Books.Add(book);
                await _context.SaveChangesAsync();

                // Trả về thông tin sách vừa tạo
                var bookResponse = new
                {
                    book.BookId,
                    book.Title,
                    book.Price,
                    book.OldPrice,
                    book.DiscountPrice,
                    CoverImage = book.CoverImage != null ? $"{Request.Scheme}://{Request.Host}/images/{book.CoverImage}" : null,
                    book.StockQuantity,
                    AuthorName = author.AuthorName,
                    PublisherName = publisher.PublisherName,
                    CategoryName = category.CategoryName,
                    book.CreatedAt,
                    book.UpdatedAt
                };

                return Ok(new { success = true, message = "Thêm sách thành công.", value = bookResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        [HttpGet("books/{id}")]
        public async Task<IActionResult> GetBookById(int id)
        {
            try
            {
                var book = await _context.Books
                    .Include(b => b.Author)
                    .Include(b => b.Publisher)
                    .Include(b => b.Category)
                    .FirstOrDefaultAsync(b => b.BookId == id);

                if (book == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy sách." });
                }

                var bookResponse = new
                {
                    book.BookId,
                    book.Title,
                    book.AuthorId,
                    book.PublisherId,
                    book.CategoryId,
                    book.Price,
                    book.OldPrice,
                    book.DiscountPrice,
                    CoverImage = book.CoverImage != null ? $"{Request.Scheme}://{Request.Host}/images/{book.CoverImage}" : null,
                    book.StockQuantity,
                    book.Isbn,
                    book.PublishedDate,
                    book.Description,
                    AuthorName = book.Author.AuthorName,
                    PublisherName = book.Publisher.PublisherName,
                    CategoryName = book.Category.CategoryName,
                    book.CreatedAt,
                    book.UpdatedAt
                };

                return Ok(new { success = true, value = bookResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        [HttpPut("books/{id}")]
        public async Task<IActionResult> UpdateBook(int id, [FromForm] BookUpdateDto bookDto)
        {
            try
            {
                var book = await _context.Books.FindAsync(id);
                if (book == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy sách." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });
                }

                var author = await _context.Authors.FindAsync(bookDto.AuthorId);
                var publisher = await _context.Publishers.FindAsync(bookDto.PublisherId);
                var category = await _context.Categories.FindAsync(bookDto.CategoryId);

                if (author == null || publisher == null || category == null)
                {
                    return BadRequest(new { success = false, message = "Tác giả, nhà xuất bản hoặc danh mục không tồn tại." });
                }

                book.Title = bookDto.Title;
                book.AuthorId = bookDto.AuthorId;
                book.PublisherId = bookDto.PublisherId;
                book.CategoryId = bookDto.CategoryId;
                book.Price = bookDto.Price;
                book.OldPrice = bookDto.OldPrice;
                book.DiscountPrice = bookDto.DiscountPrice;
                book.StockQuantity = bookDto.StockQuantity;
                book.Isbn = bookDto.Isbn;
                book.PublishedDate = bookDto.PublishedDate;
                book.Description = bookDto.Description;
                book.UpdatedAt = DateTime.UtcNow;

                if (bookDto.CoverImage != null && bookDto.CoverImage.Length > 0)
                {
                    if (!string.IsNullOrEmpty(book.CoverImage))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "images", book.CoverImage);
                        if (System.IO.File.Exists(oldFilePath)) System.IO.File.Delete(oldFilePath);
                    }

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(bookDto.CoverImage.FileName);
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "images", fileName);
                    Directory.CreateDirectory(Path.GetDirectoryName(filePath));
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await bookDto.CoverImage.CopyToAsync(stream);
                    }
                    book.CoverImage = fileName;
                }

                await _context.SaveChangesAsync();

                var bookResponse = new
                {
                    book.BookId,
                    book.Title,
                    book.Price,
                    book.OldPrice,
                    book.DiscountPrice,
                    CoverImage = book.CoverImage != null ? $"{Request.Scheme}://{Request.Host}/images/{book.CoverImage}" : null,
                    book.StockQuantity,
                    AuthorName = author.AuthorName,
                    PublisherName = publisher.PublisherName,
                    CategoryName = category.CategoryName,
                    book.CreatedAt,
                    book.UpdatedAt
                };

                return Ok(new { success = true, message = "Cập nhật sách thành công.", value = bookResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        [HttpDelete("books/{id}")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy sách." });
            }

            if (!string.IsNullOrEmpty(book.CoverImage))
            {
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "images", book.CoverImage);
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
            }

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Xóa sách thành công." });
        }

        [HttpGet("books/authors")]
        public async Task<IActionResult> GetAuthors()
        {
            var authors = await _context.Authors
                .Select(a => new { a.AuthorId, a.AuthorName })
                .ToListAsync();
            return Ok(new { success = true, value = authors });
        }

        [HttpGet("books/publishers")]
        public async Task<IActionResult> GetPublishers()
        {
            var publishers = await _context.Publishers
                .Select(p => new { p.PublisherId, p.PublisherName })
                .ToListAsync();
            return Ok(new { success = true, value = publishers });
        }

        [HttpGet("books/categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => new { c.CategoryId, c.CategoryName })
                .ToListAsync();
            return Ok(new { success = true, value = categories });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(int userId, [FromQuery] string? search)
        {
            try
            {
                var admin = await _context.Users.FindAsync(userId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
                }

                var users = await query
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Email,
                        u.PhoneNumber,
                        u.Address,
                        u.Role,
                        u.CreatedAt,
                        u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, value = users });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id, [FromQuery] int adminId)
        {
            try
            {
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng." });
                }

                if (user.UserId == adminId)
                {
                    return BadRequest(new { success = false, message = "Không thể xóa tài khoản của chính bạn." });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa người dùng thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] AdminUpdateUserRequest request, [FromQuery] int adminId)
        {
            try
            {
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng." });
                }

                if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != id))
                {
                    return BadRequest(new { success = false, message = "Email đã tồn tại." });
                }

                user.FullName = request.FullName;
                user.Email = request.Email;
                user.PhoneNumber = request.PhoneNumber;
                user.Address = request.Address;
                user.Role = request.Role;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var userResponse = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.Address,
                    user.Role,
                    user.CreatedAt,
                    user.UpdatedAt
                };

                return Ok(new { success = true, message = "Cập nhật thông tin người dùng thành công.", value = userResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        // GET: api/admin/reviews - Lấy danh sách đánh giá
        [HttpGet("reviews")]
        public async Task<IActionResult> GetReviews(
            [FromQuery] int adminId,
            [FromQuery] string? search,
            [FromQuery] int? bookId,
            [FromQuery] int? rating)
        {
            try
            {
                // Kiểm tra quyền admin
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var query = _context.Reviews
                    .Include(r => r.User)
                    .Include(r => r.Book)
                    .AsQueryable();

                // Tìm kiếm theo nội dung bình luận
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(r => r.Comment.Contains(search));
                }

                // Lọc theo BookId
                if (bookId.HasValue)
                {
                    query = query.Where(r => r.BookId == bookId.Value);
                }

                // Lọc theo rating
                if (rating.HasValue)
                {
                    query = query.Where(r => r.Rating == rating.Value);
                }

                var reviews = await query
                    .Select(r => new
                    {
                        r.ReviewId,
                        r.BookId,
                        BookTitle = r.Book.Title,
                        r.UserId,
                        UserName = r.User.FullName,
                        r.Rating,
                        r.Comment,
                        r.CreatedAt
                    })
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(new { success = true, value = reviews });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        // DELETE: api/admin/reviews/{id} - Xóa đánh giá
        [HttpDelete("reviews/{id}")]
        public async Task<IActionResult> DeleteReview(int id, [FromQuery] int adminId)
        {
            try
            {
                // Kiểm tra quyền admin
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var review = await _context.Reviews.FindAsync(id);
                if (review == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá." });
                }

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa đánh giá thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }


        // GET: api/admin/discounts - Lấy danh sách mã giảm giá
        [HttpGet("discounts")]
        public async Task<IActionResult> GetDiscounts([FromQuery] int adminId)
        {
            try
            {
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var discounts = await _context.Discounts
                    .Select(d => new
                    {
                        d.DiscountId,
                        d.Code,
                        d.DiscountAmount,
                        d.StartDate,
                        d.EndDate,
                        d.UsageLimit,
                        UsedCount = _context.UserDiscounts.Count(ud => ud.DiscountId == d.DiscountId && ud.IsUsed == true),
                        AssignedCount = _context.UserDiscounts.Count(ud => ud.DiscountId == d.DiscountId)
                    })
                    .OrderByDescending(d => d.StartDate)
                    .ToListAsync();

                return Ok(new { success = true, value = discounts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        // POST: api/admin/discounts - Thêm mã giảm giá mới
        [HttpPost("discounts")]
        public async Task<IActionResult> CreateDiscount([FromBody] DiscountCreateDto discountDto, [FromQuery] int adminId)
        {
            try
            {
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                // Kiểm tra dữ liệu đầu vào
                if (string.IsNullOrWhiteSpace(discountDto.Code))
                {
                    return BadRequest(new { success = false, message = "Mã giảm giá không được để trống." });
                }

                if (await _context.Discounts.AnyAsync(d => d.Code == discountDto.Code))
                {
                    return BadRequest(new { success = false, message = "Mã giảm giá đã tồn tại." });
                }

                if (discountDto.DiscountAmount <= 0)
                {
                    return BadRequest(new { success = false, message = "Số tiền giảm giá phải lớn hơn 0." });
                }

                if (discountDto.StartDate >= discountDto.EndDate)
                {
                    return BadRequest(new { success = false, message = "Ngày bắt đầu phải trước ngày kết thúc." });
                }

                if (discountDto.UsageLimit.HasValue && discountDto.UsageLimit <= 0)
                {
                    return BadRequest(new { success = false, message = "Giới hạn sử dụng phải lớn hơn 0 nếu có." });
                }

                var discount = new Discount
                {
                    Code = discountDto.Code,
                    DiscountAmount = discountDto.DiscountAmount,
                    StartDate = discountDto.StartDate,
                    EndDate = discountDto.EndDate,
                    UsageLimit = discountDto.UsageLimit
                };

                _context.Discounts.Add(discount);
                await _context.SaveChangesAsync();

                var discountResponse = new
                {
                    discount.DiscountId,
                    discount.Code,
                    discount.DiscountAmount,
                    discount.StartDate,
                    discount.EndDate,
                    discount.UsageLimit,
                    UsedCount = 0,
                    AssignedCount = 0
                };

                return Ok(new { success = true, message = "Thêm mã giảm giá thành công.", value = discountResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        // PUT: api/admin/discounts/{id} - Cập nhật mã giảm giá
        [HttpPut("discounts/{id}")]
        public async Task<IActionResult> UpdateDiscount(int id, [FromBody] DiscountUpdateDto discountDto, [FromQuery] int adminId)
        {
            try
            {
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var discount = await _context.Discounts.FindAsync(id);
                if (discount == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy mã giảm giá." });
                }

                // Kiểm tra dữ liệu đầu vào
                if (string.IsNullOrWhiteSpace(discountDto.Code))
                {
                    return BadRequest(new { success = false, message = "Mã giảm giá không được để trống." });
                }

                if (await _context.Discounts.AnyAsync(d => d.Code == discountDto.Code && d.DiscountId != id))
                {
                    return BadRequest(new { success = false, message = "Mã giảm giá đã tồn tại." });
                }

                if (discountDto.DiscountAmount <= 0)
                {
                    return BadRequest(new { success = false, message = "Số tiền giảm giá phải lớn hơn 0." });
                }

                if (discountDto.StartDate >= discountDto.EndDate)
                {
                    return BadRequest(new { success = false, message = "Ngày bắt đầu phải trước ngày kết thúc." });
                }

                if (discountDto.UsageLimit.HasValue && discountDto.UsageLimit <= 0)
                {
                    return BadRequest(new { success = false, message = "Giới hạn sử dụng phải lớn hơn 0 nếu có." });
                }

                // Cập nhật thông tin
                discount.Code = discountDto.Code;
                discount.DiscountAmount = discountDto.DiscountAmount;
                discount.StartDate = discountDto.StartDate;
                discount.EndDate = discountDto.EndDate;
                discount.UsageLimit = discountDto.UsageLimit;

                await _context.SaveChangesAsync();

                var discountResponse = new
                {
                    discount.DiscountId,
                    discount.Code,
                    discount.DiscountAmount,
                    discount.StartDate,
                    discount.EndDate,
                    discount.UsageLimit,
                    UsedCount = _context.UserDiscounts.Count(ud => ud.DiscountId == discount.DiscountId && ud.IsUsed == true),
                    AssignedCount = _context.UserDiscounts.Count(ud => ud.DiscountId == discount.DiscountId)
                };

                return Ok(new { success = true, message = "Cập nhật mã giảm giá thành công.", value = discountResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        // DELETE: api/admin/discounts/{id} - Xóa mã giảm giá
        [HttpDelete("discounts/{id}")]
        public async Task<IActionResult> DeleteDiscount(int id, [FromQuery] int adminId)
        {
            try
            {
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                var discount = await _context.Discounts.FindAsync(id);
                if (discount == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy mã giảm giá." });
                }

                _context.Discounts.Remove(discount);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa mã giảm giá thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        // POST: api/admin/authors - Thêm tác giả mới
        [HttpPost("authors")]
        public async Task<IActionResult> CreateAuthor([FromBody] AuthorCreateDto authorDto, [FromQuery] int adminId)
        {
            try
            {
                // Kiểm tra quyền admin
                var admin = await _context.Users.FindAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền truy cập." });
                }

                // Kiểm tra dữ liệu đầu vào
                if (string.IsNullOrWhiteSpace(authorDto.AuthorName))
                {
                    return BadRequest(new { success = false, message = "Tên tác giả không được để trống." });
                }

                // Kiểm tra xem tác giả đã tồn tại chưa (dựa trên tên)
                if (await _context.Authors.AnyAsync(a => a.AuthorName == authorDto.AuthorName))
                {
                    return BadRequest(new { success = false, message = "Tác giả này đã tồn tại." });
                }

                // Tạo đối tượng Author
                var author = new Author
                {
                    AuthorName = authorDto.AuthorName,
                    Bio = authorDto.Bio
                };

                // Thêm vào database
                _context.Authors.Add(author);
                await _context.SaveChangesAsync();

                // Trả về thông tin tác giả vừa tạo
                var authorResponse = new
                {
                    author.AuthorId,
                    author.AuthorName,
                    author.Bio
                };

                return Ok(new { success = true, message = "Thêm tác giả thành công.", value = authorResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }


    }
    public class BookCreateDto
    {
        public required string Title { get; set; } // Bắt buộc
        public int AuthorId { get; set; }
        public int PublisherId { get; set; }
        public int CategoryId { get; set; }
        public decimal Price { get; set; }
        public decimal OldPrice { get; set; }
        public decimal? DiscountPrice { get; set; } // Có thể null
        public int StockQuantity { get; set; }
        public required string Isbn { get; set; } // Bắt buộc
        public DateOnly? PublishedDate { get; set; } // Có thể null
        public string? Description { get; set; } // Có thể null
        public IFormFile? CoverImage { get; set; } // Có thể null
    }

    public class BookUpdateDto
    {
        public required string Title { get; set; }
        public int AuthorId { get; set; }
        public int PublisherId { get; set; }
        public int CategoryId { get; set; }
        public decimal Price { get; set; }
        public decimal OldPrice { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int StockQuantity { get; set; }
        public required string Isbn { get; set; }
        public DateOnly? PublishedDate { get; set; }
        public string? Description { get; set; }
        public IFormFile? CoverImage { get; set; }
    }

    public class AdminUpdateUserRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string Role { get; set; }
    }
    // DTO cho request cập nhật đánh giá
    public class AdminUpdateReviewRequest
    {
        public int Rating { get; set; }
        public string Comment { get; set; }
    }

    // DTO cho thêm mã giảm giá
    public class DiscountCreateDto
    {
        public required string Code { get; set; }
        public decimal DiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? UsageLimit { get; set; }
    }

    // DTO cho cập nhật mã giảm giá
    public class DiscountUpdateDto
    {
        public required string Code { get; set; }
        public decimal DiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? UsageLimit { get; set; }
    }

    // DTO cho thêm tác giả
    public class AuthorCreateDto
    {
        public required string AuthorName { get; set; } // Bắt buộc
        public string? Bio { get; set; } // Không bắt buộc
    }
}