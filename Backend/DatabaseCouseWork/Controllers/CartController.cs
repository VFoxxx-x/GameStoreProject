using DatabaseCouseWork.DTOs.Cart;
using DatabaseCouseWork.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DatabaseCouseWork.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Корзина доступна ТОЛЬКО авторизованным пользователям
    public class CartController : ControllerBase
    {
        private readonly MydbContext _context;

        public CartController(MydbContext context)
        {
            _context = context;
        }

        // Вспомогательный метод для получения ID текущего пользователя из JWT токена
        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        }

        // 1. ПРОСМОТР КОРЗИНЫ (GET: api/Cart)
        [HttpGet]
        public async Task<IActionResult> GetMyCart()
        {
            int userId = GetCurrentUserId();

            var cartItems = await _context.Carts // У вас таблица называется cart, класс скорее всего Cart
                .Include(c => c.Games) // Подгружаем данные игры (название, цену)
                .Where(c => c.UsersId == userId)
                .Select(c => new CartItemResponseDto
                {
                    CartId = c.Id,
                    GameId = c.GamesId,
                    GameTitle = c.Games.Title,
                    Price = c.Games.Price,
                    AddedAt = c.AddedAt
                })
                .ToListAsync();

            decimal totalAmount = cartItems.Sum(item => item.Price); //подсчёт общей суммы на сервере

            return Ok(new
            {
                Items = cartItems,
                TotalAmount = totalAmount
            });
        }


        // 2. ДОБАВЛЕНИЕ ИГРЫ В КОРЗИНУ (POST: api/Cart/add/5)
        [HttpPost("add/{gameId}")]
        public async Task<IActionResult> AddToCart(int gameId)
        {
            int userId = GetCurrentUserId();

            // Проверка 1: Существует ли игра и не удалена ли она?
            var game = await _context.Games.FindAsync(gameId);
            if (game == null || game.IsDeleted)
                return NotFound("Игра не найдена или недоступна для покупки.");

            // Проверка 2: А вдруг игра уже есть в библиотеке пользователя? (Зачем покупать дважды)
            bool alreadyOwned = await _context.UserLibraries.AnyAsync(l => l.UsersId == userId && l.GamesId == gameId);
            if (alreadyOwned)
                return BadRequest("Эта игра уже есть в вашей библиотеке.");

            // Проверка 3: Может игра уже лежит в корзине?
            bool alreadyInCart = await _context.Carts.AnyAsync(c => c.UsersId == userId && c.GamesId == gameId);
            if (alreadyInCart)
                return BadRequest("Игра уже добавлена в корзину.");

            // Если всё ок - добавляем!
            var cartItem = new Cart // Класс вашей корзины (сгенерированный EF Core)
            {
                UsersId = userId,
                GamesId = gameId,
                AddedAt = DateTime.Now // Если вы добавили это поле, как мы обсуждали
            };

            _context.Carts.Add(cartItem);
            await _context.SaveChangesAsync();

            return Ok("Игра успешно добавлена в корзину.");
        }

        // 3. УДАЛЕНИЕ ИГРЫ ИЗ КОРЗИНЫ (DELETE: api/Cart/remove/5)
        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            int userId = GetCurrentUserId();

            // Ищем запись в корзине (убеждаясь, что человек удаляет ИЗ СВОЕЙ корзины)
            var cartItem = await _context.Carts.FirstOrDefaultAsync(c => c.Id == cartItemId && c.UsersId == userId);

            if (cartItem == null)
                return NotFound("Игра в корзине не найдена.");

            _context.Carts.Remove(cartItem);
            await _context.SaveChangesAsync();

            return Ok("Игра удалена из корзины.");
        }

        // 4. ОЧИСТИТЬ ВСЮ КОРЗИНУ (DELETE: api/Cart/clear)
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            int userId = GetCurrentUserId();
            var userCart = await _context.Carts.Where(c => c.UsersId == userId).ToListAsync();

            _context.Carts.RemoveRange(userCart);
            await _context.SaveChangesAsync();

            return Ok("Корзина очищена.");
        }

        // ==========================================
        // 5. ОФОРМЛЕНИЕ ЗАКАЗА (CHECKOUT)
        // ==========================================
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout()
        {
            int userId = GetCurrentUserId();

            // 1. Достаем корзину клиента
            var cartItems = await _context.Carts 
                .Include(c => c.Games)
                .Where(c => c.UsersId == userId) 
                .ToListAsync();

            if (cartItems == null || !cartItems.Any())
                return BadRequest("Ваша корзина пуста.");

            decimal totalAmount = cartItems.Sum(c => c.Games.Price);

            // 2. СТАРТУЕМ ТРАНЗАКЦИЮ (Защита данных)
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Шаг А: Создаем главный чек в таблице Orders
                    var order = new Order
                    {
                        UsersId = userId, 
                        CreatedAt = DateTime.UtcNow,
                        Amount = totalAmount,
                        Status = "Paid" // Статус "Оплачен"
                    };

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync(); // Сохраняем, чтобы получить ID чека

                    // Шаг Б: Переносим игры в позиции чека и в БИБЛИОТЕКУ
                    foreach (var item in cartItems)
                    {
                        // 1. Запись в чек (OrderItem)
                        _context.OrderItems.Add(new OrderItem // Проверьте имя класса: OrderItem или Order_Item
                        {
                            OrderId = order.Id,
                            GameId = item.GamesId,
                            Quantity = 1,
                            Price = item.Games.Price // Фиксируем цену на момент покупки!
                        });

                        // 2. Выдаем лицензию в библиотеку (UserLibrary)
                        bool alreadyOwned = await _context.UserLibraries.AnyAsync(l => l.UsersId == userId && l.GamesId == item.GamesId);
                        if (!alreadyOwned)
                        {
                            _context.UserLibraries.Add(new UserLibrary
                            {
                                UsersId = userId,
                                GamesId = item.GamesId,
                                AcquiredAt = DateTime.UtcNow
                            });
                        }
                    }

                    // Шаг В: Отправляем уведомление
                    _context.Notifications.Add(new Notification
                    {
                        UsersId = userId,
                        Type = "Success",
                        Title = "Транзакция одобрена",
                        Message = $"Вы успешно приобрели {cartItems.Count} лицензий на сумму {totalAmount} ₿. Игры добавлены в Библиотеку.",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });

                    // Шаг Г: Очищаем корзину
                    _context.Carts.RemoveRange(cartItems);

                    // Сохраняем всё и подтверждаем транзакцию
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { message = "Покупка успешно оформлена!" });
                }
                catch (Exception ex)
                {
                    // Если база данных ругнется (например, нет какой-то колонки) - откатываем всё назад
                    await transaction.RollbackAsync();
                    return BadRequest($"Сбой транзакции БД: {ex.Message}");
                }
            }
        }
    }
}
