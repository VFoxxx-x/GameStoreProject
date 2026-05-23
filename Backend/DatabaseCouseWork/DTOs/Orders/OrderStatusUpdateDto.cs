using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs
{
    public class OrderStatusUpdateDto
    {
        [Required]
        // Разрешаем вводить ТОЛЬКО три конкретных слова
        [RegularExpression("^(Paid|Refunded|Canceled)$",
            ErrorMessage = "Статус может быть только: Paid, Refunded или Canceled")]
        public string NewStatus { get; set; } = null!;
    }
}
