namespace DatabaseCouseWork.DTOs.Game
{
    public class GameDetailsResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public decimal Price { get; set; }

        // --- ДЕТАЛЬНЫЕ ПОЛЯ ---
        public sbyte? AgeRating { get; set; } // Или byte, как у вас настроено
        public DateOnly? ReleaseDate { get; set; } // Или DateTime
        public string? Description { get; set; }
        public string? ImagePath { get; set; }

        // Массивы для красивого вывода
        public List<string> GenreNames { get; set; } = new List<string>();
        public List<string> PlatformNames { get; set; } = new List<string>();
        public List<string> DeveloperNames { get; set; } = new List<string>();
        public List<string> PublisherNames { get; set; } = new List<string>();
    }
}
