using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int GameId { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public virtual Game Game { get; set; } = null!;

    public virtual Order Order { get; set; } = null!;
}
