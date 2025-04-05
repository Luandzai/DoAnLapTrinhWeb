using BookStoreApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using System.IO;
using BookStoreApi.Services;
var builder = WebApplication.CreateBuilder(args);

// ✅ Thêm CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()  // Cho phép mọi domain (frontend)
                  .AllowAnyMethod()  // Cho phép mọi phương thức (GET, POST, PUT, DELETE)
                  .AllowAnyHeader(); // Cho phép mọi header
        });
});

// ✅ Đăng ký dịch vụ
builder.Services.AddControllers();
builder.Services.AddDbContext<OnlineBookstoreContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ✅ Cấu hình JSON để tránh vòng lặp khi serialize dữ liệu
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
    options.JsonSerializerOptions.WriteIndented = true;
});

builder.Services.AddScoped<EmailService>();

var app = builder.Build();

// ✅ Cấu hình middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ✅ Áp dụng CORS trước khi xử lý request
app.UseCors("AllowAll");

// ✅ Cấu hình phục vụ ảnh tĩnh từ thư mục "images"
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "images")),
    RequestPath = "/images"
});

app.UseAuthorization();
app.MapControllers();

app.Run();
