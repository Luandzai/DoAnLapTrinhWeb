using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using BookStoreApi.Models;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class BooksController : ControllerBase
{
    private readonly OnlineBookstoreContext _context;

    public BooksController(OnlineBookstoreContext context)
    {
        _context = context;
    }

    // 🟢 API: Lấy tất cả sách (có hỗ trợ tìm kiếm và lọc theo danh mục)
    [HttpGet]
    public async Task<IActionResult> GetBooks([FromQuery] string? search, [FromQuery] string? categoryId)
    {
        var query = _context.Books
            .Include(b => b.Author)
            .Include(b => b.Publisher)
            .Include(b => b.Category)
            .AsQueryable();

        // 📌 Lọc theo từ khóa tìm kiếm
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(b => b.Title.Contains(search));
        }

        // 📌 Lọc theo danh mục (hỗ trợ nhiều danh mục)
        if (!string.IsNullOrEmpty(categoryId))
        {
            var categoryIds = categoryId.Split(',').Select(int.Parse).ToList();
            query = query.Where(b => categoryIds.Contains(b.CategoryId)); // Sửa lại thành CategoryId
        }

        var books = await query
            .Select(b => new
            {
                b.BookId,
                b.Title,
                b.Price,
                b.OldPrice,
                b.DiscountPrice,
                coverImage = $"{Request.Scheme}://{Request.Host}/images/{b.CoverImage}",
                soldQuantity = b.SoldQuantity
            })
            .ToListAsync();

        return Ok(books);
    }

    // 🟢 API: Lấy sách Flash Sale
    [HttpGet("FlashSale")]
    public async Task<ActionResult<IEnumerable<object>>> GetFlashSaleBooks()
    {
        var flashSaleBooks = await _context.Books
            .Where(b => b.DiscountPrice != null && b.StockQuantity > 0)
            .Include(b => b.Author)
            .Include(b => b.Publisher)
            .Include(b => b.Category)
            .OrderByDescending(b => b.SoldQuantity)
            .Select(b => new
            {
                b.BookId,
                b.Title,
                b.Price,
                b.OldPrice,
                b.DiscountPrice,
                coverImage = $"{Request.Scheme}://{Request.Host}/images/{b.CoverImage}",
                soldQuantity = b.SoldQuantity,
                stockQuantity = b.StockQuantity,
                categoryName = b.Category.CategoryName,
                authorName = b.Author.AuthorName,
                publisherName = b.Publisher.PublisherName
            })
            .Take(4)
            .ToListAsync();

        return Ok(flashSaleBooks);
    }

    // 🟢 API: Lấy sách nổi bật (8 quyển bán chạy nhất)
    [HttpGet("Featured")]
    public async Task<ActionResult<IEnumerable<object>>> GetFeaturedBooks()
    {
        var featuredBooks = await _context.Books
            .Include(b => b.Author)
            .Include(b => b.Publisher)
            .Include(b => b.Category)
            .OrderByDescending(b => b.SoldQuantity) // Sắp xếp theo số lượng bán giảm dần
            .Take(8) // Chỉ lấy 8 quyển
            .Select(b => new
            {
                b.BookId,
                b.Title,
                b.Price,
                b.OldPrice,
                b.DiscountPrice,
                coverImage = $"{Request.Scheme}://{Request.Host}/images/{b.CoverImage}",
                soldQuantity = b.SoldQuantity,
                stockQuantity = b.StockQuantity,
                categoryName = b.Category.CategoryName,
                authorName = b.Author.AuthorName,
                publisherName = b.Publisher.PublisherName
            })
            .ToListAsync();

        return Ok(featuredBooks);
    }

    // 🟢 API: Lấy sách mới cập nhật (16 quyển mới nhất)
    [HttpGet("New")]
    public async Task<ActionResult<IEnumerable<object>>> GetNewBooks()
    {
        var newBooks = await _context.Books
            .Include(b => b.Author)
            .Include(b => b.Publisher)
            .Include(b => b.Category)
            .OrderByDescending(b => b.CreatedAt) // Sắp xếp theo thời gian tạo, mới nhất trước
            .Take(16) // Lấy 16 sách mới nhất
            .Select(b => new
            {
                b.BookId,
                b.Title,
                b.Price,
                b.DiscountPrice,
                b.OldPrice,
                coverImage = $"{Request.Scheme}://{Request.Host}/images/{b.CoverImage}",
                soldQuantity = b.SoldQuantity
            })
            .ToListAsync();

        return Ok(newBooks);
    }
}
