using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookStoreApi.Models;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public ReviewsController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // API: Lấy danh sách đánh giá
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviews([FromQuery] int? bookId)
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Book)
                .AsQueryable();

            if (bookId.HasValue)
            {
                query = query.Where(r => r.BookId == bookId.Value);
            }

            var reviews = await query.ToListAsync();
            return Ok(reviews);
        }

        // API: Thêm đánh giá
        [HttpPost]
        public async Task<ActionResult> AddReview([FromBody] ReviewDTO reviewDto)
        {
            // Kiểm tra sách
            var book = await _context.Books.FindAsync(reviewDto.BookId);
            if (book == null)
            {
                return NotFound(new { message = "Không tìm thấy sách!" });
            }

            // Kiểm tra người dùng
            var user = await _context.Users.FindAsync(reviewDto.UserId);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng!" });
            }

            // Kiểm tra dữ liệu đầu vào
            if (reviewDto.Rating < 1 || reviewDto.Rating > 5)
            {
                return BadRequest(new { message = "Điểm đánh giá phải từ 1 đến 5!" });
            }

            if (string.IsNullOrWhiteSpace(reviewDto.Comment))
            {
                return BadRequest(new { message = "Nội dung đánh giá không được để trống!" });
            }

            // Tạo review mới
            var review = new Review
            {
                BookId = reviewDto.BookId,
                UserId = reviewDto.UserId,
                Rating = reviewDto.Rating,
                Comment = reviewDto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đánh giá đã được thêm thành công!" });
        }
    }
}

public class ReviewDTO
{
    public int UserId { get; set; }
    public int BookId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
}