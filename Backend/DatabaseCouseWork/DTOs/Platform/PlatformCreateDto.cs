using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs
{
    public class PlatformCreateDto
    {
        [Required(ErrorMessage = "Название платформы обязательно.")]
        [MaxLength(100, ErrorMessage = "Название не может быть длиннее 100 символов.")]
        public string Title { get; set; } = null!;
        public string Type { get; set; } = null!;


    }
}
