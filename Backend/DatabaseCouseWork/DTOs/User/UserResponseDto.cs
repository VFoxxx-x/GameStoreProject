namespace DatabaseCouseWork.DTOs
{
    public class UserResponseDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string RoleName { get; set; } = null!; // Название роли, а не просто цифра
        public bool IsBanned { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
