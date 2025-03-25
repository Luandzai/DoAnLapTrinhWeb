using System;
using System.Collections.Generic;

namespace BookStoreApi.Models;

public partial class UserDiscount
{
    public int UserDiscountId { get; set; }

    public int UserId { get; set; }

    public int DiscountId { get; set; }

    public bool? IsUsed { get; set; }

    public DateTime? AssignedDate { get; set; }

    public virtual Discount Discount { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
