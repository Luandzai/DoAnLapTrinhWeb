using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public CartsController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // GET: api/Carts?userId={userId}
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCartItems([FromQuery] int userId)
        {
            // Kiểm tra xem userId có hợp lệ không
            var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
            if (!userExists)
            {
                return NotFound(new { message = "Người dùng không tồn tại!" });
            }

            var cartItems = await _context.Carts
                .Where(c => c.UserId == userId)
                .Include(c => c.Book)
                .Select(c => new
                {
                    c.CartId,
                    c.UserId,
                    c.BookId,
                    c.Quantity,
                    c.CreatedAt,
                    Book = new
                    {
                        c.Book.BookId,
                        c.Book.Title,
                        c.Book.Price,
                        c.Book.OldPrice,
                        c.Book.DiscountPrice,
                        CoverImage = $"{Request.Scheme}://{Request.Host}/images/{c.Book.CoverImage}",
                        c.Book.StockQuantity,
                        c.Book.SoldQuantity
                    }
                })
                .ToListAsync();

            if (!cartItems.Any())
            {
                return Ok(new { message = "Giỏ hàng trống!", items = new List<object>() });
            }

            return Ok(cartItems);
        }

        // PUT: api/Carts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCartItem(int id, [FromBody] UpdateCartRequest request)
        {
            if (request == null || request.Quantity <= 0)
            {
                return BadRequest(new { message = "Số lượng không hợp lệ!" });
            }

            var cartItem = await _context.Carts
                .Include(c => c.Book)
                .FirstOrDefaultAsync(c => c.CartId == id);

            if (cartItem == null)
            {
                return NotFound(new { message = "Không tìm thấy mục trong giỏ hàng!" });
            }

            // Kiểm tra số lượng tồn kho
            if (cartItem.Book.StockQuantity < request.Quantity)
            {
                return BadRequest(new { message = "Số lượng vượt quá tồn kho!" });
            }

            // Cập nhật số lượng
            cartItem.Quantity = request.Quantity;
            _context.Carts.Update(cartItem);

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật số lượng thành công!" });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật giỏ hàng!", error = ex.Message });
            }
        }

        // DELETE: api/Carts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCartItem(int id)
        {
            var cartItem = await _context.Carts
                .FirstOrDefaultAsync(c => c.CartId == id);

            if (cartItem == null)
            {
                return NotFound(new { message = "Không tìm thấy mục trong giỏ hàng!" });
            }

            _context.Carts.Remove(cartItem);

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Xóa mục khỏi giỏ hàng thành công!" });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa mục!", error = ex.Message });
            }
        }

        // POST: api/Carts
        [HttpPost]
        public async Task<ActionResult> AddToCart([FromBody] AddCartRequest request)
        {
            if (request == null || request.UserId <= 0 || request.BookId <= 0 || request.Quantity <= 0)
            {
                return BadRequest(new { message = "Dữ liệu không hợp lệ!" });
            }

            // Kiểm tra người dùng và sách có tồn tại không
            var userExists = await _context.Users.AnyAsync(u => u.UserId == request.UserId);
            if (!userExists)
            {
                return NotFound(new { message = "Người dùng không tồn tại!" });
            }

            var book = await _context.Books
                .FirstOrDefaultAsync(b => b.BookId == request.BookId);
            if (book == null)
            {
                return NotFound(new { message = "Sách không tồn tại!" });
            }

            // Kiểm tra số lượng tồn kho
            if (book.StockQuantity < request.Quantity)
            {
                return BadRequest(new { message = "Số lượng vượt quá tồn kho!" });
            }

            // Kiểm tra xem mục đã tồn tại trong giỏ hàng chưa
            var existingCartItem = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == request.UserId && c.BookId == request.BookId);

            if (existingCartItem != null)
            {
                // Nếu đã tồn tại, tăng số lượng
                var newQuantity = existingCartItem.Quantity + request.Quantity;
                if (book.StockQuantity < newQuantity)
                {
                    return BadRequest(new { message = "Số lượng vượt quá tồn kho sau khi gộp!" });
                }

                existingCartItem.Quantity = newQuantity;
                _context.Carts.Update(existingCartItem);
            }
            else
            {
                // Nếu chưa tồn tại, thêm mới
                var newCartItem = new Cart
                {
                    UserId = request.UserId,
                    BookId = request.BookId,
                    Quantity = request.Quantity,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(newCartItem);
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Thêm vào giỏ hàng thành công!" });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra khi thêm vào giỏ hàng!", error = ex.Message });
            }
        }
    }

    // DTO cho yêu cầu cập nhật số lượng
    public class UpdateCartRequest
    {
        public int Quantity { get; set; }
    }

    // DTO cho yêu cầu thêm vào giỏ hàng
    public class AddCartRequest
    {
        public int UserId { get; set; }
        public int BookId { get; set; }
        public int Quantity { get; set; }
    }
}