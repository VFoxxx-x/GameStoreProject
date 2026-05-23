using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace DatabaseCouseWork.Models;

public partial class MydbContext : DbContext
{
    public MydbContext()
    {
    }

    public MydbContext(DbContextOptions<MydbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<Developer> Developers { get; set; }

    public virtual DbSet<Game> Games { get; set; }

    public virtual DbSet<GameDiscussion> GameDiscussions { get; set; }

    public virtual DbSet<Genre> Genres { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Platform> Platforms { get; set; }

    public virtual DbSet<Publisher> Publishers { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserLibrary> UserLibraries { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb3_general_ci")
            .HasCharSet("utf8mb3");

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("cart");

            entity.HasIndex(e => e.GamesId, "fk_cart_Games1_idx");

            entity.HasIndex(e => e.UsersId, "fk_cart_Users1_idx");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AddedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("added_at");
            entity.Property(e => e.GamesId).HasColumnName("Games_id");
            entity.Property(e => e.UsersId).HasColumnName("Users_id");

            entity.HasOne(d => d.Games).WithMany(p => p.Carts)
                .HasForeignKey(d => d.GamesId)
                .HasConstraintName("fk_cart_Games1");

            entity.HasOne(d => d.Users).WithMany(p => p.Carts)
                .HasForeignKey(d => d.UsersId)
                .HasConstraintName("fk_cart_Users1");
        });

        modelBuilder.Entity<Developer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("developers");

            entity.HasIndex(e => e.Title, "Title_UNIQUE").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.Title)
                .HasMaxLength(100)
                .HasColumnName("title");
        });

        modelBuilder.Entity<Game>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("games");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AgeRating).HasColumnName("age_rating");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.ImagePath)
                .HasMaxLength(255)
                .HasColumnName("image_path");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Price)
                .HasPrecision(10, 2)
                .HasColumnName("price");
            entity.Property(e => e.ReleaseDate).HasColumnName("release_date");
            entity.Property(e => e.SystemRequirements)
                .HasColumnType("text")
                .HasColumnName("system_requirements");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");

            entity.HasMany(d => d.Developers).WithMany(p => p.Games)
                .UsingEntity<Dictionary<string, object>>(
                    "GameDeveloper",
                    r => r.HasOne<Developer>().WithMany()
                        .HasForeignKey("DeveloperId")
                        .HasConstraintName("fk_Game_has_Developer_Developer1"),
                    l => l.HasOne<Game>().WithMany()
                        .HasForeignKey("GameId")
                        .HasConstraintName("fk_Game_has_Developer_Game1"),
                    j =>
                    {
                        j.HasKey("GameId", "DeveloperId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("game_developer");
                        j.HasIndex(new[] { "DeveloperId" }, "fk_Game_has_Developer_Developer1_idx");
                        j.HasIndex(new[] { "GameId" }, "fk_Game_has_Developer_Game1_idx");
                        j.IndexerProperty<int>("GameId").HasColumnName("game_id");
                        j.IndexerProperty<int>("DeveloperId").HasColumnName("developer_id");
                    });

            entity.HasMany(d => d.Genres).WithMany(p => p.Games)
                .UsingEntity<Dictionary<string, object>>(
                    "GameGenre",
                    r => r.HasOne<Genre>().WithMany()
                        .HasForeignKey("GenreId")
                        .HasConstraintName("fk_Game_has_Genre_Genre1"),
                    l => l.HasOne<Game>().WithMany()
                        .HasForeignKey("GameId")
                        .HasConstraintName("fk_Game_has_Genre_Game1"),
                    j =>
                    {
                        j.HasKey("GameId", "GenreId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("game_genre");
                        j.HasIndex(new[] { "GameId" }, "fk_Game_has_Genre_Game1_idx");
                        j.HasIndex(new[] { "GenreId" }, "fk_Game_has_Genre_Genre1_idx");
                        j.IndexerProperty<int>("GameId").HasColumnName("game_id");
                        j.IndexerProperty<int>("GenreId").HasColumnName("genre_id");
                    });

            entity.HasMany(d => d.Platforms).WithMany(p => p.Games)
                .UsingEntity<Dictionary<string, object>>(
                    "GamePlatform",
                    r => r.HasOne<Platform>().WithMany()
                        .HasForeignKey("PlatformId")
                        .HasConstraintName("fk_Game_has_Platform_Platform1"),
                    l => l.HasOne<Game>().WithMany()
                        .HasForeignKey("GameId")
                        .HasConstraintName("fk_Game_has_Platform_Game1"),
                    j =>
                    {
                        j.HasKey("GameId", "PlatformId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("game_platform");
                        j.HasIndex(new[] { "GameId" }, "fk_Game_has_Platform_Game1_idx");
                        j.HasIndex(new[] { "PlatformId" }, "fk_Game_has_Platform_Platform1_idx");
                        j.IndexerProperty<int>("GameId").HasColumnName("game_id");
                        j.IndexerProperty<int>("PlatformId").HasColumnName("platform_id");
                    });

            entity.HasMany(d => d.Publishers).WithMany(p => p.Games)
                .UsingEntity<Dictionary<string, object>>(
                    "GamePublisher",
                    r => r.HasOne<Publisher>().WithMany()
                        .HasForeignKey("PublisherId")
                        .HasConstraintName("fk_Game_has_Publisher_Publisher1"),
                    l => l.HasOne<Game>().WithMany()
                        .HasForeignKey("GameId")
                        .HasConstraintName("fk_Game_has_Publisher_Game1"),
                    j =>
                    {
                        j.HasKey("GameId", "PublisherId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("game__publisher");
                        j.HasIndex(new[] { "GameId" }, "fk_Game_has_Publisher_Game1_idx");
                        j.HasIndex(new[] { "PublisherId" }, "fk_Game_has_Publisher_Publisher1_idx");
                        j.IndexerProperty<int>("GameId").HasColumnName("game_id");
                        j.IndexerProperty<int>("PublisherId").HasColumnName("publisher_id");
                    });
        });

        modelBuilder.Entity<GameDiscussion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("game_discussions");

            entity.HasIndex(e => e.ParentId, "fk_discussion_parent_idx");

            entity.HasIndex(e => e.GamesId, "fk_game_discussions_Games1_idx");

            entity.HasIndex(e => e.UsersId, "fk_game_discussions_Users1_idx");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.GamesId).HasColumnName("Games_id");
            entity.Property(e => e.Message)
                .HasColumnType("text")
                .HasColumnName("message");
            entity.Property(e => e.ParentId).HasColumnName("Parent_id");
            entity.Property(e => e.UsersId).HasColumnName("Users_id");

            entity.HasOne(d => d.Games).WithMany(p => p.GameDiscussions)
                .HasForeignKey(d => d.GamesId)
                .HasConstraintName("fk_game_discussions_Games1");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_discussion_parent");

            entity.HasOne(d => d.Users).WithMany(p => p.GameDiscussions)
                .HasForeignKey(d => d.UsersId)
                .HasConstraintName("fk_game_discussions_Users1");
        });

        modelBuilder.Entity<Genre>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("genres");

            entity.HasIndex(e => e.Title, "Title_UNIQUE").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.Title)
                .HasMaxLength(100)
                .HasColumnName("title");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("notifications");

            entity.HasIndex(e => e.UsersId, "fk_Notifications_Users1_idx");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.Message)
                .HasColumnType("text")
                .HasColumnName("message");
            entity.Property(e => e.Title)
                .HasMaxLength(150)
                .HasColumnName("title");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .HasColumnName("type");
            entity.Property(e => e.UsersId).HasColumnName("Users_id");

            entity.HasOne(d => d.Users).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UsersId)
                .HasConstraintName("fk_Notifications_Users1");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("orders");

            entity.HasIndex(e => e.UsersId, "fk_Orders_Users1_idx");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasPrecision(10, 2)
                .HasColumnName("amount");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Status)
                .HasMaxLength(25)
                .HasColumnName("status");
            entity.Property(e => e.UsersId).HasColumnName("Users_id");

            entity.HasOne(d => d.Users).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UsersId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_Orders_Users1");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("order_items");

            entity.HasIndex(e => e.GameId, "fk_Order_Items_Game1_idx");

            entity.HasIndex(e => e.OrderId, "fk_Order_Items_Order1_idx");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.GameId).HasColumnName("game_id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.Price)
                .HasPrecision(10, 2)
                .HasColumnName("price");
            entity.Property(e => e.Quantity).HasColumnName("quantity");

            entity.HasOne(d => d.Game).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.GameId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_Order_Items_Game1");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("fk_Order_Items_Order1");
        });

        modelBuilder.Entity<Platform>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("platforms");

            entity.HasIndex(e => e.Title, "Title_UNIQUE").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Title)
                .HasMaxLength(100)
                .HasColumnName("title");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .HasColumnName("type");
        });

        modelBuilder.Entity<Publisher>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("publishers");

            entity.HasIndex(e => e.Title, "Title_UNIQUE").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.Title)
                .HasMaxLength(100)
                .HasColumnName("title");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("roles");

            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "Email_UNIQUE").IsUnique();

            entity.HasIndex(e => e.RolesId, "fk_Clients_Roles1_idx");

            entity.HasIndex(e => e.Name, "name_UNIQUE").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(150)
                .HasColumnName("email");
            entity.Property(e => e.ImagePath)
                .HasMaxLength(255)
                .HasColumnName("image_path");
            entity.Property(e => e.IsBanned).HasColumnName("is_banned");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.RolesId).HasColumnName("Roles_Id");

            entity.HasOne(d => d.Roles).WithMany(p => p.Users)
                .HasForeignKey(d => d.RolesId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_Clients_Roles1");
        });

        modelBuilder.Entity<UserLibrary>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("user_library");

            entity.HasIndex(e => e.GamesId, "fk_user_library_Games1_idx");

            entity.HasIndex(e => e.UsersId, "fk_user_library_Users1_idx");

            entity.HasIndex(e => new { e.UsersId, e.GamesId }, "uq_user_game").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AcquiredAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("acquired_at");
            entity.Property(e => e.GamesId).HasColumnName("Games_id");
            entity.Property(e => e.UsersId).HasColumnName("Users_id");

            entity.HasOne(d => d.Games).WithMany(p => p.UserLibraries)
                .HasForeignKey(d => d.GamesId)
                .HasConstraintName("fk_user_library_Games1");

            entity.HasOne(d => d.Users).WithMany(p => p.UserLibraries)
                .HasForeignKey(d => d.UsersId)
                .HasConstraintName("fk_user_library_Users1");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
