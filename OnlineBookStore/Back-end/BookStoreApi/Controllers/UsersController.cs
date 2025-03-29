using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            // Kiểm tra email và mật khẩu trong cơ sở dữ liệu
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.PasswordHash == request.Password);

            if (user == null)
            {
                return BadRequest(new { message = "Email hoặc mật khẩu không đúng." });
            }

            // Trả về userId
            return Ok(new { 
                UserId = user.UserId,
                FullName = user.FullName,
                Role = user.Role 
            });
        }

        // POST: api/Users/register
        [HttpPost("register")]
        public async Task<ActionResult> Register([FromBody] RegisterRequest request) {
            try {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password)) {
                    return BadRequest(new { message = "Thông tin không đầy đủ. Vui lòng kiểm tra lại." });
                }

                // Check if email already exists
                if (await _context.Users.AnyAsync(u => u.Email == request.Email)) {
                    return BadRequest(new { message = "Email đã được sử dụng." });
                }

                // Hash the password before saving
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

                // Create a new User object
                var user = new User {
                    FullName = request.FullName,
                    Email = request.Email,
                    PasswordHash = hashedPassword,
                    Role = "User",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    PhoneNumber = "", // Default value
                    Address = "" // Default value
                };

                // Add the user to the database
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đăng ký thành công!" });
            } catch (DbUpdateException dbEx) {
                // Log database-related errors
                Console.WriteLine($"Database error during registration: {dbEx.InnerException?.Message ?? dbEx.Message}");
                return StatusCode(500, new { message = "Lỗi cơ sở dữ liệu khi đăng ký." });
            } catch (Exception ex) {
                // Log general errors
                Console.WriteLine($"Error during registration: {ex.Message}");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi đăng ký." });
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