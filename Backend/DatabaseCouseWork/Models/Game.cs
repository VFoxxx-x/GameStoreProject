using System;
using System.Collections.Generic;

namespace DatabaseCouseWork.Models;

public partial class Game
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public decimal Price { get; set; }

    public sbyte? AgeRating { get; set; }

    public DateOnly? ReleaseDate { get; set; }

    public string? Description { get; set; }

    public bool IsDeleted { get; set; }

    public string? ImagePath { get; set; }

    public string? SystemRequirements { get; set; }

    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    public virtual ICollection<GameDiscussion> GameDiscussions { get; set; } = new List<GameDiscussion>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<UserLibrary> UserLibraries { get; set; } = new List<UserLibrary>();

    public virtual ICollection<Developer> Developers { get; set; } = new List<Developer>();

    public virtual ICollection<Genre> Genres { get; set; } = new List<Genre>();

    public virtual ICollection<Platform> Platforms { get; set; } = new List<Platform>();

    public virtual ICollection<Publisher> Publishers { get; set; } = new List<Publisher>();
}
