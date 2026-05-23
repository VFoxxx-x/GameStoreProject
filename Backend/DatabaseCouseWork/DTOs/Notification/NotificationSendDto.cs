using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs
{
    public class NotificationSendDto
    {
        [Required(ErrorMessage = "Необходимо указать ID пользователя.")]
        public int TargetUserId { get; set; }

        [Required(ErrorMessage = "Заголовок обязателен.")]
        [MaxLength(150)]
        public string Title { get; set; } = null!;

        [Required(ErrorMessage = "Сообщение не может быть пустым.")]
        public string Message { get; set; } = null!;

        public string Type { get; set; } = "Info"; // По умолчанию обычное инфо-сообщение
    }
}
