using System;
using System.Collections.Generic;

namespace BookStoreApi.Models;

public partial class ShippingFee
{
    public int Id { get; set; }

    public string Province { get; set; } = null!;

    public decimal Fee { get; set; }
}
