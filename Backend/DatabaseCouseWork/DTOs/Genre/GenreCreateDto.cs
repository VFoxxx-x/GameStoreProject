using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs
{
    public class GenreCreateDto
    {
        [Required(ErrorMessage = "Название жанра обязательно.")]
        [MaxLength(100, ErrorMessage = "Название не может быть длиннее 100 символов.")]
        public string Title { get; set; } = null!;

        public string? Description { get; set; } // Описание может быть пустым
    }
}
