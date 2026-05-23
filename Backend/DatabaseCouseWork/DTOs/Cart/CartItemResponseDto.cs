namespace DatabaseCouseWork.DTOs.Cart
{
    public class CartItemResponseDto
    {
        public int CartId { get; set; }
        public int GameId { get; set; }
        public string GameTitle { get; set; } = null!;
        public decimal Price { get; set; }
        public DateTime? AddedAt { get; set; }

        // public int Quantity { get; set; }
    }
}
