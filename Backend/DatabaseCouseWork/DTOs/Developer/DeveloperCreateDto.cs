using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs
{
    public class DeveloperCreateDto
    {
        [Required(ErrorMessage = "Название разработчика обязательно.")]
        [MaxLength(100, ErrorMessage = "Название не может быть длиннее 100 символов.")]
        public string Title { get; set; } = null!;

        public string? Description { get; set; } // Описание может быть пустым
    }
}
