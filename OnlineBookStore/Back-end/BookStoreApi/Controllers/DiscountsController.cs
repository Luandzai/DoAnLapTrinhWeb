using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiscountsController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public DiscountsController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // GET: api/Discounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Discount>>> GetDiscounts()
        {
            // Lấy danh sách mã giảm giá còn hiệu lực (StartDate <= Now <= EndDate)
            var currentDate = DateTime.Now;
            var discounts = await _context.Discounts
                .Where(d => d.StartDate <= currentDate && d.EndDate >= currentDate)
                .ToListAsync();

            // Luôn trả về mảng, kể cả khi không có dữ liệu
            return Ok(discounts ?? new List<Discount>());
        }
        // POST: api/Discounts/save
        [HttpPost("save")]
        public async Task<ActionResult<UserDiscount>> SaveDiscount([FromBody] SaveDiscountRequest request)
        {
            // Kiểm tra xem mã giảm giá có tồn tại không
            var discount = await _context.Discounts.FindAsync(request.DiscountId);
            if (discount == null)
            {
                return NotFound(new { message = "Mã giảm giá không tồn tại." });
            }

            // Kiểm tra xem người dùng đã lưu mã này chưa
            var existingUserDiscount = await _context.UserDiscounts
                .FirstOrDefaultAsync(ud => ud.UserId == request.UserId && ud.DiscountId == request.DiscountId);
            if (existingUserDiscount != null)
            {
                return BadRequest(new { message = "Bạn đã lưu mã giảm giá này rồi." });
            }

            // Tạo bản ghi mới trong UserDiscount
            var userDiscount = new UserDiscount
            {
                UserId = request.UserId,
                DiscountId = request.DiscountId,
                AssignedDate = DateTime.Now, // Sử dụng AssignedDate thay vì SavedAt
                IsUsed = false // Đặt mặc định là chưa sử dụng
            };

            _context.UserDiscounts.Add(userDiscount);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Lưu mã giảm giá thành công!", userDiscount });
        }
    }
    
    // DTO để nhận dữ liệu từ frontend
    public class SaveDiscountRequest
    {
        public int UserId { get; set; }
        public int DiscountId { get; set; }
    }
}