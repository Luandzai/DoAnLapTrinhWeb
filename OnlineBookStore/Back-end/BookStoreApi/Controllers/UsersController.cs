using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;


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

       // POST: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Email hoặc mật khẩu không đúng." });
            }

            // Kiểm tra mật khẩu đã mã hóa
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return BadRequest(new { message = "Email hoặc mật khẩu không đúng." });
            }

            // Trả về thông tin người dùng nếu đăng nhập thành công
            return Ok(new { 
                UserId = user.UserId,
                FullName = user.FullName,
                Role = user.Role 
            });

        }

    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            Console.WriteLine($"Received Request: {JsonSerializer.Serialize(request)}");

            if (string.IsNullOrWhiteSpace(request.FullName) || 
                string.IsNullOrWhiteSpace(request.Email) || 
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Thông tin không đầy đủ." });
            }

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email đã được sử dụng." });
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = hashedPassword,
                Role = "Customer",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký thành công!" });
        }
        catch (DbUpdateException dbEx)
    {
        Console.WriteLine($"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}");
        return StatusCode(500, new { message = $"Lỗi cơ sở dữ liệu: {dbEx.InnerException?.Message ?? dbEx.Message}" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Unexpected error: {ex.Message}");
        return StatusCode(500, new { message = $"Lỗi không xác định: {ex.Message}" });
    }

    }

        // POST: api/Users/change-password
        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
                if (user == null)
                {
                    return NotFound(new { message = "Người dùng không tồn tại." });
                }

                // Verify the current password
                if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "Mật khẩu hiện tại không đúng." });
                }

                // Hash the new password and update it
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đổi mật khẩu thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during password change: {ex.Message}");
                return StatusCode(500, new { message = "Đã xảy ra lỗi. Vui lòng thử lại sau.", error = ex.Message });
            }
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Email,
                        u.Role
                    })
                    .ToListAsync();

                if (users == null || !users.Any())
                {
                    return NotFound(new { message = "No users found." });
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching users: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching users." });
            }
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
    public class RegisterRequest {
        public string FullName { get; set; } 
        public string Email { get; set; } 
        public string Password { get; set; } 
    }
    public class ChangePasswordRequest
    {
        public int UserId { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}