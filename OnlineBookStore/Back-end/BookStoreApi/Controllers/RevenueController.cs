using Microsoft.AspNetCore.Mvc;
using BookStoreApi.Models;
using BookStoreApi.Models.Requests;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RevenueController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public RevenueController(OnlineBookstoreContext context)
        {
            _context = context;
        }


        // API để tính tổng doanh thu theo tháng và năm chỉ tính các đơn hàng có status là "Delivered"
        [HttpGet("GetMonthlyRevenue")]
        public IActionResult GetMonthlyRevenue(int month, int year)
        {
            try
            {
                // Lọc các đơn hàng theo tháng, năm và status là "Delivered"
                var ordersInMonth = _context.Orders
                    .Where(o => o.OrderDate.Month == month && o.OrderDate.Year == year && o.Status == "Delivered")
                    .Include(o => o.OrderDetails)
                    .ToList();

                // Tính tổng doanh thu từ các đơn hàng đã giao
                decimal totalRevenue = ordersInMonth
                    .SelectMany(o => o.OrderDetails)
                    .Sum(od => od.Quantity * od.UnitPrice);

                // Trả về kết quả doanh thu theo tháng
                return Ok(new Revenue
                {
                    Month = month,
                    Year = year,
                    TotalRevenue = totalRevenue
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Có lỗi xảy ra: {ex.Message}");
            }
        }
    }
}
