using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs
{
    public class ProfileUpdateDto
    {
        [Required(ErrorMessage = "Имя пользователя не может быть пустым.")]
        [MaxLength(50)]
        public string Username { get; set; } = null!;

        // Пользователь может вставить ссылку на новую аватарку
        public string? ImagePath { get; set; }

        // В будущем сюда можно добавить: Phone, Bio (О себе) и т.д.
    }
}
