using System;
using System.Collections.Generic;

namespace BookStoreApi.Models;

public partial class Transaction
{
    public int TransactionId { get; set; }

    public int? UserId { get; set; }

    public int OrderId { get; set; }

    public int? PaymentId { get; set; }

    public decimal Amount { get; set; }

    public DateTime? TransactionDate { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual Payment? Payment { get; set; }

    public virtual User? User { get; set; }
}
