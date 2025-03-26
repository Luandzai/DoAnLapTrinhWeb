using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookStoreApi.Models;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShippingFeesController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public ShippingFeesController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // 📌 API lấy danh sách tỉnh/thành phố + phí vận chuyển
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ShippingFee>>> GetShippingFees()
        {
            return await _context.ShippingFees.ToListAsync();
        }
    }
}
