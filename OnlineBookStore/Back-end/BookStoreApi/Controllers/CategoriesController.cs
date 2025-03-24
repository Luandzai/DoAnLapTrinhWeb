using BookStoreApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookStoreApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController : ControllerBase
{
    private readonly OnlineBookstoreContext _context;

    public CategoriesController(OnlineBookstoreContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        // Tải tất cả categories cùng với danh mục con
        var allCategories = await _context.Categories
            .Include(c => c.InverseParentCategory) // Tải danh mục con
            .ToListAsync();

        // Lọc các category cha (ParentCategoryId = null)
        var parentCategories = allCategories
            .Where(c => c.ParentCategoryId == null)
            .Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
                SubCategories = c.InverseParentCategory
                    .Select(sub => new CategoryDto
                    {
                        CategoryId = sub.CategoryId,
                        CategoryName = sub.CategoryName,
                        SubCategories = sub.InverseParentCategory
                            .Select(s => new CategoryDto
                            {
                                CategoryId = s.CategoryId,
                                CategoryName = s.CategoryName,
                                SubCategories = new List<CategoryDto>() // Nếu có cấp sâu hơn
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .ToList();

        return Ok(parentCategories);
    }
}

// DTO để trả về dữ liệu phân cấp
public class CategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public List<CategoryDto> SubCategories { get; set; } = new List<CategoryDto>();
}