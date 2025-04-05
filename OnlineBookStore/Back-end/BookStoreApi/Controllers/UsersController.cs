using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace BookStoreApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly OnlineBookstoreContext _context;

        public UsersController(OnlineBookstoreContext context)
        {
            _context = context;
        }

        // GET: api/Users/{userId}
        [HttpGet("{userId}")]
        public async Task<ActionResult> GetUserById(int userId)
        {
            try
            {
                // Tìm người dùng theo UserId
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                // Nếu không tìm thấy người dùng
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng với UserId này." });
                }

                // Trả về thông tin người dùng
                return Ok(new
                {
                    success = true,
                    message = "Lấy thông tin người dùng thành công.",
                    data = new
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        Email = user.Email,
                        PhoneNumber = user.PhoneNumber,
                        Address = user.Address,
                        Role = user.Role,
                        CreatedAt = user.CreatedAt,
                        UpdatedAt = user.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Đã xảy ra lỗi khi lấy thông tin người dùng.",
                    error = ex.Message
                });
            }
        }

        // 📌 PUT: api/Users/{userId} - Cập nhật thông tin người dùng
        [HttpPut("{userId}")]
        public async Task<ActionResult> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy người dùng." });
            }

            // Kiểm tra email mới có bị trùng không
            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != userId))
            {
                return BadRequest(new { success = false, message = "Email đã tồn tại." });
            }

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.PhoneNumber = request.PhoneNumber;
            user.Address = request.Address;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Cập nhật thông tin thành công." });
        }

        // POST: api/Users/register
        [HttpPost("register")]
        public async Task<ActionResult> Register([FromBody] RegisterRequest request)
        {
            // Kiểm tra email đã tồn tại chưa
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email đã được sử dụng." });
            }

            // Tạo user mới
            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // Hash mật khẩu
                Role = "Customer", // Mặc định là Customer
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Role = user.Role
            });
        }

        // POST: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest(new { message = "Email hoặc mật khẩu không đúng." });
            }

            return Ok(new
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Role = user.Role
            });
        }

        // 📌 POST: api/Users/change-password
        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng." });
                }

                // Kiểm tra mật khẩu cũ
                if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                {
                    return BadRequest(new { success = false, message = "Mật khẩu cũ không đúng." });
                }

                // Cập nhật mật khẩu mới
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đổi mật khẩu thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ.", error = ex.Message });
            }
        }

        

    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }
    
    public class UpdateUserRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
    }

    public class ChangePasswordRequest
{
    public int UserId { get; set; }
    public string OldPassword { get; set; }
    public string NewPassword { get; set; }
}
}
