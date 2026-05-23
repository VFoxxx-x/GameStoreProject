namespace DatabaseCouseWork.DTOs
{
    public class GameDiscussionResponseDto
    {
        public int CommentId { get; set; }
        public string AuthorName { get; set; } = null!; // Никнейм или "[Удаленный пользователь]"
        public string Message { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }

        public List<GameDiscussionResponseDto> Replies { get; set; } = new(); //список ответов
    }
}
