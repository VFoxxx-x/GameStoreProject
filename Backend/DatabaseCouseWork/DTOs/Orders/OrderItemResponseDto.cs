namespace DatabaseCouseWork.DTOs
{
    public class OrderItemResponseDto
    {
        public string GameTitle { get; set; } = null!;
        public decimal PriceAtPurchase { get; set; } // Цена на момент покупки
        public int Quantity { get; set; }
    }
}
