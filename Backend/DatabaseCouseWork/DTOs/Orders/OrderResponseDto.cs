namespace DatabaseCouseWork.DTOs
{
    public class OrderResponseDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = null!; // Кто купил (нужно для Админа)
        public DateTime Date { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = null!;

        // Вкладываем список купленных игр прямо внутрь чека!
        public List<OrderItemResponseDto> Items { get; set; } = new List<OrderItemResponseDto>();
    }
}
