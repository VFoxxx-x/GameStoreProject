using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class Order
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; }

    public decimal Amount { get; set; }

    public string Status { get; set; } = null!;

    public int UsersId { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual User Users { get; set; } = null!;
}
