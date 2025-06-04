using Microsoft.AspNetCore.Mvc;
using BookStoreApi.Models;
using BookStoreApi.Models.Requests;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // Thêm này

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "RequireAdminRole")] // Thêm attribute này để yêu cầu role Admin
    public class RevenueController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public RevenueController(OnlineBookstoreContext context)
        {
            _context = context;
        }
        // API để lọc doanh thu theo thời gian
        [HttpGet("filter")]
        public IActionResult GetRevenueByDateRange(DateTime? startDate, DateTime? endDate)
        {
            try
            {
                if (startDate == null || endDate == null)
                {
                    return BadRequest(new { success = false, message = "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ." });
                }

                DateTime start = startDate.Value.Date;
                DateTime end = endDate.Value.Date.AddDays(1).AddTicks(-1);

                var ordersQuery = _context.Orders
                    .Where(o => o.Status == "Delivered" && o.OrderDate >= start && o.OrderDate <= end)
                    .Include(o => o.User);

                var orders = ordersQuery
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        customerName = o.User.FullName,
                        totalPrice = o.TotalPrice,
                        orderDate = o.OrderDate
                    })
                    .ToList();

                var totalRevenue = orders.Sum(o => o.totalPrice);

                return Ok(new { success = true, totalRevenue, orders });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Lỗi máy chủ: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }
    }
}
