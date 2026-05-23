using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class GameDiscussion
{
    public int Id { get; set; }

    public string? Message { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int GamesId { get; set; }

    public int UsersId { get; set; }

    public int? ParentId { get; set; }

    public virtual Game Games { get; set; } = null!;

    public virtual ICollection<GameDiscussion> InverseParent { get; set; } = new List<GameDiscussion>();

    public virtual GameDiscussion? Parent { get; set; }

    public virtual User Users { get; set; } = null!;
}
