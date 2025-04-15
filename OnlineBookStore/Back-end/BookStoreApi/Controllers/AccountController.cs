using BookStoreApi.Models;
using BookStoreApi.Models.Requests;  // Thêm dòng này
using BookStoreApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[Route("api/[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly OnlineBookstoreContext _context;
    private readonly EmailService _emailService;

    public AccountController(OnlineBookstoreContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return NotFound("Email không tồn tại.");

        var token = Guid.NewGuid().ToString();
        user.ResetToken = token;
        user.ResetTokenExpiry = DateTime.Now.AddMinutes(15);
        await _context.SaveChangesAsync();

        var subject = "Khôi phục mật khẩu";
        var resetLink = $"http://localhost:5000/reset-password?token={token}";

        var body = $@"
            <p>Xin chào {user.FullName},</p>
            <p>Bạn đã yêu cầu khôi phục mật khẩu.</p>
            <p>Token dùng một lần của bạn là: <b>{token}</b></p>
            <p>Mã này sẽ hết hạn sau 15 phút.</p>";

        await _emailService.SendEmailAsync(user.Email, subject, body);

        return Ok(new { message = "Đã gửi mã khôi phục đến email của bạn." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.ResetToken == request.Token && u.ResetTokenExpiry > DateTime.Now);
        if (user == null)
            return BadRequest("Token không hợp lệ hoặc đã hết hạn.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword); // Hash mật khẩu mới
        user.ResetToken = null; // Xóa token sau khi dùng
        user.ResetTokenExpiry = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Mật khẩu đã được đặt lại thành công!" });
    }


}
