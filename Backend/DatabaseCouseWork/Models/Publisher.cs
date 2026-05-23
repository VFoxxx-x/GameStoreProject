using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class Publisher
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<Game> Games { get; set; } = new List<Game>();
}
