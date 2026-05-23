namespace DatabaseCouseWork.DTOs
{
    public class ProfileResponseDto
    {
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? ImagePath { get; set; } // Ссылка на аватарку

        // Как вы и хотели: информация о статусе пользователя
        public string RoleName { get; set; } = null!;
        public bool IsAdmin { get; set; } // Удобный флаг для фронтенда (чтобы показывать звездочку или бейдж)

        public DateTime? CreatedAt { get; set; }
    }
}
