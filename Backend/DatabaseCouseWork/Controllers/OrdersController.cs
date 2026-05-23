using DatabaseCouseWork.DTOs;
using DatabaseCouseWork.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace DatabaseCouseWork.Controllers
{
  

    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Доступ только для авторизованных (Клиенты и Админы)
    public class OrdersController : ControllerBase
    {
        private readonly MydbContext _context;

        public OrdersController(MydbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        }

        // ==========================================
        // 1. ИСТОРИЯ ПОКУПОК (Для текущего клиента)
        // ==========================================
        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyOrders()
        {
            int userId = GetCurrentUserId();

            // Достаем заказы клиента вместе с вложенными товарами и названиями игр
            var myOrders = await _context.Orders
            .Where(o => o.UsersId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderResponseDto // DTO
            {
                OrderId = o.Id,
                CustomerName = o.Users.Name,
                Date = o.CreatedAt,
                TotalAmount = o.Amount,
                Status = o.Status,
                Items = o.OrderItems.Select(oi => new OrderItemResponseDto // Вложенный DTO
                {
                    GameTitle = oi.Game.Title,
                    PriceAtPurchase = oi.Price,
                    Quantity = oi.Quantity
                }).ToList()
            })
            .ToListAsync();

            return Ok(myOrders);
        }

        // ==========================================
        // 2. ПРОСМОТР КОНКРЕТНОГО ЧЕКА (Клиент или Админ)
        // ==========================================
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrderDetails(int orderId)
        {
            int userId = GetCurrentUserId();
            bool isAdmin = User.IsInRole("Admin");

            // 1. Достаем чек из базы со всеми связями
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Game)
                .Include(o => o.Users)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return NotFound("Заказ не найден.");

            // Безопасность: Клиент может смотреть ТОЛЬКО свой чек. Админ - любой.
            if (order.UsersId != userId && !isAdmin)
                return Forbid("У вас нет доступа к этому заказу.");

            var responseDto = new OrderResponseDto
            {
                OrderId = order.Id,
                CustomerName = order.Users.Name,
                Date = order.CreatedAt,
                TotalAmount = order.Amount,
                Status = order.Status,
                Items = order.OrderItems.Select(oi => new OrderItemResponseDto
                {
                    GameTitle = oi.Game.Title,
                    PriceAtPurchase = oi.Price,
                    Quantity = oi.Quantity
                }).ToList()
            };

            return Ok(responseDto);
        }

        // ==========================================
        // 3. СПИСОК ВСЕХ ЗАКАЗОВ В МАГАЗИНЕ (Только Админ)
        // ==========================================
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var allOrders = await _context.Orders
                .Include(o => o.Users)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new OrderResponseDto
                {
                    OrderId = o.Id,
                    CustomerName = o.Users.Name,
                    Date = o.CreatedAt,
                    TotalAmount = o.Amount,
                    Status = o.Status,
                    Items = o.OrderItems.Select(oi => new OrderItemResponseDto
                    {
                        GameTitle = oi.Game.Title,
                        PriceAtPurchase = oi.Price,
                        Quantity = oi.Quantity
                    }).ToList()
                })
                .ToListAsync();

            return Ok(allOrders);
        }

        // ==========================================
        // 4. ИЗМЕНИТЬ СТАТУС ЗАКАЗА / ОФОРМИТЬ ВОЗВРАТ (Только Админ)
        // ==========================================
        [HttpPut("{orderId}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] OrderStatusUpdateDto dto)
        {
            // Возможные статусы: "Paid" (Оплачен), "Refunded" (Возврат), "Canceled" (Отменен)
            var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null) return NotFound("Заказ не найден.");

            order.Status = dto.NewStatus;

            // Если админ делает Возврат средств (Refund), логично отозвать игры из библиотеки!
            if (dto.NewStatus == "Refunded")
            {
                foreach (var item in order.OrderItems)
                {
                    var libraryEntry = await _context.UserLibraries
                        .FirstOrDefaultAsync(l => l.UsersId == order.UsersId && l.GamesId == item.GameId);

                    if (libraryEntry != null)
                    {
                        _context.UserLibraries.Remove(libraryEntry); // Отзываем лицензию
                    }
                }

                // Отправляем уведомление клиенту
                _context.Notifications.Add(new Notification
                {
                    UsersId = order.UsersId,
                    Type = "Warning",
                    Title = "Возврат средств",
                    Message = $"Заказ №{order.Id} был отменен. Средства будут возвращены, игры отозваны.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Статус заказа успешно изменен на '{dto.NewStatus}'." });
        }
    }
}
