using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class Cart
{
    public int Id { get; set; }

    public DateTime? AddedAt { get; set; }

    public int UsersId { get; set; }

    public int GamesId { get; set; }

    public virtual Game Games { get; set; } = null!;

    public virtual User Users { get; set; } = null!;
}
