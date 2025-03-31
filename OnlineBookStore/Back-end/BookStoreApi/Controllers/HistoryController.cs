using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookStoreApi.Models;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoryController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public HistoryController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // GET: api/History/{userId}
        [HttpGet("{userId}")]
        public async Task<ActionResult<IEnumerable<OrderHistoryDto>>> GetOrderHistory(int userId)
        {
            // Lấy các đơn hàng của người dùng từ bảng Order, liên kết với Transaction
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.Transactions) // Liên kết với bảng Transaction
                .Include(o => o.OrderDetails) // Liên kết với bảng OrderDetails để lấy chi tiết đơn hàng
                .ThenInclude(od => od.Book) // Liên kết với bảng Book nếu cần
                .ToListAsync();

            if (orders == null || orders.Count == 0)
            {
                return NotFound(new { message = "Không tìm thấy lịch sử mua hàng cho người dùng này." });
            }

            // Chuyển đổi dữ liệu thành DTO (Data Transfer Object) để dễ dàng gửi đến client
            var orderHistory = orders.Select(o => new OrderHistoryDto
            {
                OrderId = o.OrderId,
                OrderDate = o.OrderDate,
                TotalPrice = o.TotalPrice,
                Status = o.Status ?? string.Empty, // Đảm bảo rằng Status không null
                PaymentMethod = o.PaymentMethod,
                ShippingAddress = o.ShippingAddress,
                ShippingFee = o.ShippingFee,
                Transactions = o.Transactions?.Select(t => new TransactionDto
                {
                    TransactionId = t.TransactionId,
                    Amount = t.Amount,
                    TransactionDate = t.TransactionDate,
                    PaymentMethod = t.Payment?.PaymentMethod // Kiểm tra null cho Payment
                }).ToList() // Đảm bảo Transactions có thể null
            }).ToList();

            return Ok(orderHistory);
        }
         [HttpGet("OrderDetails/{orderId}")]
    public async Task<ActionResult<OrderDetailsDto>> GetOrderDetails(int orderId)
    {
        var order = await _context.Orders
            .Where(o => o.OrderId == orderId)
            .Include(o => o.OrderDetails)
            .ThenInclude(od => od.Book)
            .FirstOrDefaultAsync();

        if (order == null)
        {
            return NotFound(new { message = "Không tìm thấy đơn hàng." });
        }

        var orderDetails = new OrderDetailsDto
        {
            OrderId = order.OrderId,
            OrderDate = order.OrderDate,
            TotalPrice = order.TotalPrice,
            Status = order.Status ?? string.Empty,
            PaymentMethod = order.PaymentMethod,
            ShippingAddress = order.ShippingAddress,
            ShippingFee = order.ShippingFee,
            Transactions = order.Transactions?.Select(t => new TransactionDto
            {
                TransactionId = t.TransactionId,
                Amount = t.Amount,
                TransactionDate = t.TransactionDate,
                PaymentMethod = t.Payment?.PaymentMethod
            }).ToList(),
            OrderItems = order.OrderDetails.Select(od => new OrderItemDto
            {
                BookTitle = od.Book?.Title,
                Quantity = od.Quantity,
                Price = od.UnitPrice ?? 0
            }).ToList()
        };

        return Ok(orderDetails);
    }
    }

    // DTO để gửi dữ liệu đơn hàng
    public class OrderHistoryDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Status { get; set; }
        public string? PaymentMethod { get; set; }
        public string? ShippingAddress { get; set; }
        public decimal? ShippingFee { get; set; }
        public List<TransactionDto>? Transactions { get; set; }
    }

    // DTO để gửi dữ liệu giao dịch
    public class TransactionDto
    {
        public int TransactionId { get; set; }
        public decimal Amount { get; set; }
        public DateTime? TransactionDate { get; set; }
        public string? PaymentMethod { get; set; }
    }
    public class OrderDetailsDto
    {
    public int OrderId { get; set; }
    public DateTime? OrderDate { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Status { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ShippingAddress { get; set; }
    public decimal? ShippingFee { get; set; }
    public List<TransactionDto>? Transactions { get; set; }
    public List<OrderItemDto>? OrderItems { get; set; }
    }

    public class OrderItemDto
    {
    public string? BookTitle { get; set; }
    public int Quantity { get; set; }
    public decimal? Price { get; set; }
    }
}
