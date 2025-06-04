using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public OrdersController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder([FromBody] CreateOrderRequest request)
        {
            // Kiểm tra đơn hàng rỗng
            if (request.OrderItems == null || !request.OrderItems.Any())
            {
                return BadRequest(new { message = "Đơn hàng phải có ít nhất một sản phẩm." });
            }

            // Kiểm tra userId
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

            // Kiểm tra mã giảm giá (nếu có)
            if (request.DiscountId.HasValue)
            {
                var userDiscount = await _context.UserDiscounts
                    .FirstOrDefaultAsync(ud => ud.UserId == request.UserId && ud.DiscountId == request.DiscountId && ud.IsUsed == false);
                if (userDiscount == null)
                {
                    return BadRequest(new { message = "Mã giảm giá không hợp lệ hoặc đã sử dụng." });
                }
            }

            // Kiểm tra số lượng tồn kho
            foreach (var item in request.OrderItems)
            {
                var book = await _context.Books.FindAsync(item.BookId);
                if (book == null)
                {
                    return NotFound(new { message = $"Sách với ID {item.BookId} không tồn tại." });
                }
                if (book.StockQuantity < item.Quantity)
                {
                    return BadRequest(new { message = $"Sách '{book.Title}' không đủ số lượng tồn kho. Còn lại: {book.StockQuantity}." });
                }
            }

            // Kiểm tra PaymentMethod hợp lệ
            var validPaymentMethods = new List<string> { "Credit Card", "PayPal", "MoMo", "ZaloPay", "Internet Banking", "Cash On Delivery" };
            if (!validPaymentMethods.Contains(request.PaymentMethod))
            {
                return BadRequest(new { message = "Phương thức thanh toán không hợp lệ." });
            }

            // Tạo đơn hàng mới
            var order = new Order
            {
                UserId = request.UserId,
                DiscountId = request.DiscountId,
                OrderDate = DateTime.Now,
                TotalPrice = request.TotalPrice,
                Status = "Pending",
                UpdatedAt = DateTime.Now,
                ShippingAddress = request.ShippingAddress,
                PaymentMethod = request.PaymentMethod,
                ShippingFee = request.ShippingFee
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(); // Lưu để lấy OrderId

            // Tạo chi tiết đơn hàng và cập nhật số lượng tồn kho
            foreach (var item in request.OrderItems)
            {
                var book = await _context.Books.FindAsync(item.BookId);
                var orderDetail = new OrderDetail
                {
                    OrderId = order.OrderId,
                    BookId = item.BookId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                };
                _context.OrderDetails.Add(orderDetail);

                // Cập nhật số lượng tồn kho và số lượng đã bán
                book.StockQuantity -= item.Quantity;
                book.SoldQuantity += item.Quantity;
                _context.Books.Update(book);
            }
            await _context.SaveChangesAsync(); // Lưu cập nhật số lượng sách

            // Cập nhật trạng thái mã giảm giá (nếu có)
            if (request.DiscountId.HasValue)
            {
                var userDiscount = await _context.UserDiscounts
                    .FirstOrDefaultAsync(ud => ud.UserId == request.UserId && ud.DiscountId == request.DiscountId);
                if (userDiscount != null)
                {
                    userDiscount.IsUsed = true;
                    _context.UserDiscounts.Update(userDiscount);
                    // // Xóa bản ghi UserDiscount thay vì chỉ đánh dấu IsUsed
                    // _context.UserDiscounts.Remove(userDiscount);
                }
            }

            // Xóa các mục đã đặt hàng khỏi giỏ hàng của người dùng
            var cartItems = await _context.Carts
                .Where(c => c.UserId == request.UserId)
                .ToListAsync();

            var orderedBookIds = request.OrderItems.Select(oi => oi.BookId).ToList();
            var itemsToRemove = cartItems.Where(ci => orderedBookIds.Contains(ci.BookId)).ToList();

            if (itemsToRemove.Any())
            {
                _context.Carts.RemoveRange(itemsToRemove);
            }

            // Tạo bản ghi thanh toán trong bảng Payments
            var payment = new Payment
            {
                OrderId = order.OrderId,
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = request.PaymentMethod == "Cash On Delivery" ? "Unpaid" : "Paid",
                TransactionId = Guid.NewGuid().ToString("N") // Format chuẩn hơn
            };
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync(); // Lưu để có PaymentId

            // (Tùy chọn) Tạo bản ghi giao dịch
            var transaction = new Transaction
            {
                UserId = request.UserId,
                OrderId = order.OrderId,
                PaymentId = payment.PaymentId,
                Amount = request.TotalPrice,
                TransactionDate = DateTime.Now
            };
            _context.Transactions.Add(transaction);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đặt hàng thành công!", orderId = order.OrderId });
        }

        [HttpGet("history/{userId}")]
        public IActionResult GetOrderHistory(int userId)
        {
            var orders = _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new 
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalPrice,
                    o.Status,
                    o.PaymentMethod
                })
                .ToList();

            return Ok(orders);
        }

        [HttpGet("detail/{orderId}")]
        public async Task<IActionResult> GetOrderDetail(int orderId)
        {
            var order = await _context.Orders
                .Where(o => o.OrderId == orderId)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Book)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalPrice,
                    o.ShippingAddress,
                    o.PaymentMethod,
                    o.Status,
                    CustomerName = o.User.FullName,

                    // Lấy tỉnh/thành từ địa chỉ
                    Province = _context.ShippingFees
                        .Where(s => o.ShippingAddress.Contains(s.Province))
                        .Select(s => s.Province)
                        .FirstOrDefault(),

                    // Lấy phí ship dựa trên tỉnh
                    ShippingFee = _context.ShippingFees
                        .Where(s => o.ShippingAddress.Contains(s.Province))
                        .Select(s => s.Fee)
                        .FirstOrDefault(),

                    Discount = o.DiscountId.HasValue 
                        ? _context.Discounts
                            .Where(d => d.DiscountId == o.DiscountId)
                            .Select(d => d.DiscountAmount)
                            .FirstOrDefault() 
                        : 0,

                    SubTotal = o.OrderDetails.Sum(od => od.Quantity * od.UnitPrice),

                    Items = o.OrderDetails.Select(od => new
                    {
                        Title = od.Book.Title,
                        Quantity = od.Quantity,
                        UnitPrice = od.UnitPrice
                    })
                })
                .FirstOrDefaultAsync();

            if (order == null) 
                return NotFound(new { message = "Không tìm thấy đơn hàng" });

            return Ok(order);
        }

        // GET: api/admin/orders - Lấy danh sách tất cả đơn hàng (dành cho Admin)
        [HttpGet("/api/admin/orders")]
        public async Task<ActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Select(o => new
                {
                    orderId = o.OrderId,
                    customerName = o.User.FullName,
                    orderDate = o.OrderDate,
                    totalPrice = o.TotalPrice,
                    status = o.Status
                })
                .OrderByDescending(o => o.orderDate)
                .ToListAsync();

            return Ok(new { success = true, data = orders });
        }

        // PUT: api/admin/orders/{orderId}/confirm - Xác nhận đơn hàng
        [HttpPut("/api/admin/orders/{orderId}/confirm")]
        public async Task<ActionResult> ConfirmOrder(int orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy đơn hàng." });
            }

            if (order.Status != "Pending")
            {
                return BadRequest(new { success = false, message = "Đơn hàng không thể xác nhận." });
            }

            order.Status = "Shipped";
            order.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Xác nhận đơn hàng thành công." });
        }

        // PUT: api/admin/orders/{orderId}/status - Cập nhật trạng thái đơn hàng
        [HttpPut("/api/admin/orders/{orderId}/status")]
        public async Task<ActionResult> UpdateOrderStatus(int orderId, [FromBody] UpdateStatusRequest request)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy đơn hàng." });
            }

            var validStatuses = new List<string> { "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled" };
            if (!validStatuses.Contains(request.Status))
            {
                return BadRequest(new { success = false, message = "Trạng thái không hợp lệ." });
            }

            order.Status = request.Status;
            order.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Cập nhật trạng thái thành công." });
        }

        // PUT: api/admin/orders/{orderId}/cancel - Hủy đơn hàng
        [HttpPut("/api/admin/orders/{orderId}/cancel")]
        public async Task<ActionResult> CancelOrder(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Book)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy đơn hàng." });
            }

            if (order.Status == "Canceled" || order.Status == "Delivered")
            {
                return BadRequest(new { success = false, message = "Đơn hàng không thể hủy." });
            }

            // Hoàn lại số lượng tồn kho
            foreach (var detail in order.OrderDetails)
            {
                var book = detail.Book;
                book.StockQuantity += detail.Quantity;
                book.SoldQuantity -= detail.Quantity;
                _context.Books.Update(book);
            }

            order.Status = "Canceled";
            order.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Hủy đơn hàng thành công." });
        }


    }

    // DTO để nhận dữ liệu từ frontend
    public class CreateOrderRequest
    {
        public int UserId { get; set; }
        public string ShippingAddress { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
        public decimal ShippingFee { get; set; }
        public decimal TotalPrice { get; set; }
        public int? DiscountId { get; set; }
        public List<OrderItemRequest> OrderItems { get; set; } = new List<OrderItemRequest>();
    }

    public class OrderItemRequest
    {
        public int BookId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; }
    }
}
