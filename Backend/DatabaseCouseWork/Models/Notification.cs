using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class Notification
{
    public int Id { get; set; }

    public string Type { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public bool IsRead { get; set; }

    public int UsersId { get; set; }

    public virtual User Users { get; set; } = null!;
}
