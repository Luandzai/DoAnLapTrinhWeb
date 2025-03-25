using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookStoreApi.Models;
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

        // API: Thêm sách vào giỏ hàng
        [HttpPost]
        public async Task<ActionResult> AddToCart([FromBody] CartDTO cartDto)
        {
            // Kiểm tra người dùng
            var user = await _context.Users.FindAsync(cartDto.UserId);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng!" });
            }

            // Kiểm tra sách
            var book = await _context.Books.FindAsync(cartDto.BookId);
            if (book == null)
            {
                return NotFound(new { message = "Không tìm thấy sách!" });
            }

            // Kiểm tra số lượng tồn kho
            if (book.StockQuantity < cartDto.Quantity)
            {
                return BadRequest(new { message = "Số lượng tồn kho không đủ!" });
            }

            // Kiểm tra xem sách đã có trong giỏ hàng chưa
            var existingCartItem = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == cartDto.UserId && c.BookId == cartDto.BookId);

            if (existingCartItem != null)
            {
                // Nếu sách đã có trong giỏ hàng, tăng số lượng
                existingCartItem.Quantity += cartDto.Quantity;
                if (existingCartItem.Quantity > book.StockQuantity)
                {
                    return BadRequest(new { message = "Số lượng vượt quá tồn kho!" });
                }
            }
            else
            {
                // Nếu chưa có, tạo mới
                var cartItem = new Cart
                {
                    UserId = cartDto.UserId,
                    BookId = cartDto.BookId,
                    Quantity = cartDto.Quantity,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(cartItem);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã thêm sách vào giỏ hàng thành công!" });
        }
    }
}

public class CartDTO
{
    public int UserId { get; set; }
    public int BookId { get; set; }
    public int Quantity { get; set; }
}