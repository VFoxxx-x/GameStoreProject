namespace DatabaseCouseWork.DTOs
{
    public class GameResponseDto
    {
        public int Id { get; set; } // В ответе ID обязательно нужен!
        public string Title { get; set; }
        public decimal Price { get; set; }
        public List<string> Genres { get; set; } = new List<string>();
        public string? ImagePath { get; set; }
        public List<int> GenreIds { get; set; } = new List<int>();
        public List<int> PlatformIds { get; set; } = new List<int>();
        public List<int> DeveloperIds { get; set; } = new List<int>();
        public List<int> PublisherIds { get; set; } = new List<int>();
        public List<string> GenreNames { get; set; } = new List<string>();
        public List<string> PlatformNames { get; set; } = new List<string>();
        public List<string> DeveloperNames { get; set; } = new List<string>();
        public List<string> PublisherNames { get; set; } = new List<string>();
    }
}
