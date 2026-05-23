using DatabaseCouseWork.Models;
using DatabaseCouseWork.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DatabaseCouseWork.Controllers
{
    

    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Доступ только для авторизованных
    public class UserLibraryController : ControllerBase
    {
        private readonly MydbContext _context;

        public UserLibraryController(MydbContext context)
        {
            _context = context;
        }

        // Вспомогательный метод для получения ID текущего пользователя из токена
        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        }

        // ==========================================
        // 1. ПРОСМОТР СВОЕЙ БИБЛИОТЕКИ (Клиент)
        // ==========================================
        [HttpGet("my-games")]
        public async Task<IActionResult> GetMyLibrary()
        {
            int userId = GetCurrentUserId();

            // Достаем библиотеку пользователя и приклеиваем данные об играх
            var myLibrary = await _context.UserLibraries
                .Include(l => l.Games)
                .Where(l => l.UsersId == userId)
                .Select(l => new LibraryItemResponseDto //Dto
                {
                    LibraryId = l.Id,
                    GameId = l.GamesId,
                    GameTitle = l.Games.Title,
                    // Если игра была удалена админом (Soft Delete), мы можем предупредить клиента об этом
                    IsAvailable = !l.Games.IsDeleted,
                    AcquiredAt = l.AcquiredAt
                })
                .OrderByDescending(l => l.AcquiredAt) // Сначала новые покупки
                .ToListAsync();

            return Ok(myLibrary);
        }


        // ==========================================
        // 3. ПРОСМОТР БИБЛИОТЕКИ ЛЮБОГО ЮЗЕРА (Админ)
        // ==========================================
        [HttpGet("user/{targetUserId}")]
        [Authorize(Roles = "Admin")] // Только Админ
        public async Task<IActionResult> GetUserLibraryAdmin(int targetUserId)
        {
            var userLibrary = await _context.UserLibraries
                .Include(l => l.Games)
                .Where(l => l.UsersId == targetUserId)
                .Select(l => new LibraryItemResponseDto // <--- И здесь тоже отдаем DTO!
                {
                    LibraryId = l.Id,
                    GameId = l.GamesId,
                    GameTitle = l.Games.Title,
                    IsAvailable = !l.Games.IsDeleted,
                    AcquiredAt = l.AcquiredAt
                })
                .ToListAsync();

            return Ok(userLibrary);
        }

        // ==========================================
        // 4. ОТОЗВАТЬ ИГРУ / ОФОРМИТЬ ВОЗВРАТ (Админ)
        // ==========================================
        [HttpDelete("revoke/{libraryId}")]
        [Authorize(Roles = "Admin")] // Только Админ
        public async Task<IActionResult> RevokeGame(int libraryId)
        {
            // Ищем запись в библиотеке
            var libraryEntry = await _context.UserLibraries.FindAsync(libraryId);

            if (libraryEntry == null)
            {
                return NotFound("Запись в библиотеке не найдена.");
            }

            // Физически удаляем игру из библиотеки
            _context.UserLibraries.Remove(libraryEntry);

            // Бонус: Отправляем системное уведомление об изъятии/возврате
            var notification = new Notification
            {
                UsersId = libraryEntry.UsersId,
                Type = "Warning",
                Title = "Отзыв игры",
                Message = "Игра была удалена из вашей библиотеки администратором (Оформлен возврат).",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok("Игра успешно отозвана у пользователя.");
        }
    }
}
