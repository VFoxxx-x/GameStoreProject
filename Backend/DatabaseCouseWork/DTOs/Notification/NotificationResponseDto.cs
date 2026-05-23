namespace DatabaseCouseWork.DTOs
{
    public class NotificationResponseDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = null!; // "Info", "Warning", "Success"
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
