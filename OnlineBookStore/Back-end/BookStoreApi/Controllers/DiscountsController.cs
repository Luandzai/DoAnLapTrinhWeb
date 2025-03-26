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
            var currentDate = DateTime.Now;
            var discounts = await _context.Discounts
                .Where(d => d.StartDate <= currentDate && d.EndDate >= currentDate)
                .ToListAsync();
            return Ok(discounts);
        }

        // POST: api/Discounts/save
        [HttpPost("save")]
        public async Task<ActionResult<UserDiscount>> SaveDiscount([FromBody] SaveDiscountRequest request)
        {
            var discount = await _context.Discounts.FindAsync(request.DiscountId);
            if (discount == null)
            {
                return NotFound(new { message = "Mã giảm giá không tồn tại." });
            }

            var existingUserDiscount = await _context.UserDiscounts
                .FirstOrDefaultAsync(ud => ud.UserId == request.UserId && ud.DiscountId == request.DiscountId);
            if (existingUserDiscount != null)
            {
                return BadRequest(new { message = "Bạn đã lưu mã giảm giá này rồi." });
            }

            var userDiscount = new UserDiscount
            {
                UserId = request.UserId,
                DiscountId = request.DiscountId,
                AssignedDate = DateTime.Now,
                IsUsed = false
            };

            _context.UserDiscounts.Add(userDiscount);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Lưu mã giảm giá thành công!", userDiscount });
        }

        // GET: api/Discounts/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserDiscounts(int userId)
        {
            var currentDate = DateTime.Now;
            var userDiscounts = await _context.UserDiscounts
                .Where(ud => ud.UserId == userId && (ud.IsUsed == false))
                .Include(ud => ud.Discount)
                .Where(ud => ud.Discount.StartDate <= currentDate && ud.Discount.EndDate >= currentDate)
                .Select(ud => new
                {
                    ud.DiscountId,
                    ud.Discount.Code,
                    ud.Discount.DiscountAmount, // Đảm bảo dùng DiscountAmount
                    ud.Discount.StartDate,
                    ud.Discount.EndDate,
                    ud.AssignedDate
                })
                .ToListAsync();

            return Ok(userDiscounts); // Loại bỏ ?? để tránh lỗi CS0019
        }

        // DELETE: api/Discounts/user/{userId}/discount/{discountId}
        [HttpDelete("user/{userId}/discount/{discountId}")]
        public async Task<IActionResult> DeleteUserDiscount(int userId, int discountId)
        {
            var userDiscount = await _context.UserDiscounts
                .FirstOrDefaultAsync(ud => ud.UserId == userId && ud.DiscountId == discountId);

            if (userDiscount == null)
            {
                return NotFound(new { message = "Mã giảm giá không tồn tại hoặc không được lưu bởi người dùng này." });
            }

            _context.UserDiscounts.Remove(userDiscount);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa mã giảm giá thành công!" });
        }
    }

    // DTO để nhận dữ liệu từ frontend
    public class SaveDiscountRequest
    {
        public int UserId { get; set; }
        public int DiscountId { get; set; }
    }
}