using System;
using System.Collections.Generic;

namespace BookStoreApi.Models;

public partial class Book
{
    public int BookId { get; set; }

    public string Title { get; set; } = null!;

    public int AuthorId { get; set; }

    public int PublisherId { get; set; }

    public int CategoryId { get; set; }

    public decimal Price { get; set; }

    public decimal OldPrice { get; set; }

    public decimal? DiscountPrice { get; set; }

    public int? SoldQuantity { get; set; }

    public int? StockQuantity { get; set; }

    public string Isbn { get; set; } = null!;

    public DateOnly? PublishedDate { get; set; }

    public string? Description { get; set; }

    public string? CoverImage { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Author Author { get; set; } = null!;

    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual Publisher Publisher { get; set; } = null!;

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
