using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class Platform
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string Type { get; set; } = null!;

    public virtual ICollection<Game> Games { get; set; } = new List<Game>();
}
