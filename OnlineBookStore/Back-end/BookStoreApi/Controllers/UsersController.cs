using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Net.Mail;
using Microsoft.AspNetCore.Identity.Data;

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
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.PasswordHash == request.Password);

            if (user == null)
            {
                return BadRequest(new { message = "Email hoặc mật khẩu không đúng." });
            }

            return Ok(new { 
                UserId = user.UserId,
                FullName = user.FullName,
                Role = user.Role 
            });
        }

        // POST: api/Users/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            // Tìm user theo email hoặc số điện thoại
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email || u.PhoneNumber == request.Phone);

            if (user == null)
                return BadRequest(new { message = "User không tồn tại với thông tin đã cung cấp." });

            // Sinh token reset mật khẩu
            var resetToken = GenerateResetToken();

            // Lưu token vào bảng ResetTokens
            var tokenRecord = new ResetToken
            {
                UserId = user.UserId,
                Token = resetToken,
                ExpiryDate = DateTime.Now.AddMinutes(30) // Token có thời gian sống 30 phút
            };
            _context.ResetTokens.Add(tokenRecord);
            await _context.SaveChangesAsync();

            // Gửi email hoặc SMS với token
            SendResetEmail(user.Email, resetToken);

            return Ok(new { message = "Mã reset mật khẩu đã được gửi đến email của bạn." });
        }

        // Sinh token ngẫu nhiên để reset mật khẩu
        private string GenerateResetToken()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                var byteArray = new byte[32];
                rng.GetBytes(byteArray);
                return BitConverter.ToString(byteArray).Replace("-", "").ToLower();
            }
        }

        // Gửi email với link reset mật khẩu
        private void SendResetEmail(string email, string token)
        {
            var mailMessage = new MailMessage("your-email@example.com", email)
            {
                Subject = "Yêu cầu reset mật khẩu",
                Body = $"Để reset mật khẩu, hãy nhấp vào liên kết này: https://your-website.com/reset-password?token={token}",
                IsBodyHtml = true
            };

            var smtpClient = new SmtpClient("smtp.your-email-provider.com")
            {
                Port = 587,
                Credentials = new System.Net.NetworkCredential("your-email@example.com", "your-email-password"),
                EnableSsl = true,
            };

            smtpClient.Send(mailMessage);
        }
    }

    // DTO để nhận yêu cầu quên mật khẩu từ client
    public class ForgotPasswordRequest
    {
        public string? Email { get; set; }
        public string? Phone { get; set; }
    }
}
