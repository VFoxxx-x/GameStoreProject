namespace DatabaseCouseWork.DTOs
{
    public class LibraryItemResponseDto
    {
        public int LibraryId { get; set; }
        public int GameId { get; set; }
        public string GameTitle { get; set; } = null!;
        public bool IsAvailable { get; set; } // Если игра удалена из магазина, будет false
        public DateTime? AcquiredAt { get; set; }
        public string? ImagePath { get; set; }
        //public int PlaytimeMinutes { get; set; }
    }
}
