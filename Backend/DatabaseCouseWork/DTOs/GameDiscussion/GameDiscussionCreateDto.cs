using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs
{
    public class GameDiscussionCreateDto
    {
        // [Required] и [MaxLength] - валидация 
        // Если клиент пришлет пустую строку или слишком длинную, ASP.NET сам вернет ошибку 400.
        [Required(ErrorMessage = "Сообщение не может быть пустым.")]
        [MaxLength(1000, ErrorMessage = "Сообщение слишком длинное (максимум 1000 символов).")]
        public string Message { get; set; } = null!;

        public int? ParentId { get; set; }
    }
}
