namespace DatabaseCouseWork.DTOs
{
    public class GameCreateDto
    {
        public string Title { get; set; } = null!;
        public decimal Price { get; set; }
        public sbyte? AgeRating { get; set; } // В MySQL это TINYINT
        public DateOnly? ReleaseDate { get; set; }
        public string? Description { get; set; }
        public string? ImagePath { get; set; }
        public string? SystemRequirements { get; set; }
        public List<int> GenreIds { get; set; } = new List<int>();
        public List<int> PlatformIds { get; set; } = new List<int>();
        public List<int> DeveloperIds { get; set; } = new List<int>();
        public List<int> PublisherIds { get; set; } = new List<int>();
    }
}
