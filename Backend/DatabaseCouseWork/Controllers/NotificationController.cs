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
    [Authorize] // Доступ только для авторизованных
    public class NotificationsController : ControllerBase
    {
        private readonly MydbContext _context;

        public NotificationsController(MydbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        }

        // ==========================================
        // 1. ПОЛУЧИТЬ ВСЕ СВОИ УВЕДОМЛЕНИЯ
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            int userId = GetCurrentUserId();

            var notifications = await _context.Notifications
                .Where(n => n.UsersId == userId) // Проверьте имя: UsersId или UserId
                .OrderByDescending(n => n.CreatedAt).Select(n => new NotificationResponseDto // <--- ИСПОЛЬЗУЕМ DTO
                {
                    Id = n.Id,
                    Type = n.Type,
                    Title = n.Title,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
            .ToListAsync();
            return Ok(notifications);
        }

        // ==========================================
        // 2. ПОЛУЧИТЬ КОЛИЧЕСТВО НЕПРОЧИТАННЫХ (Для красной точки на 🔔)
        // ==========================================
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            int userId = GetCurrentUserId();

            int count = await _context.Notifications
                .CountAsync(n => n.UsersId == userId && !n.IsRead);

            return Ok(new { unreadCount = count });
        }

        // ==========================================
        // 3. ОТМЕТИТЬ ОДНО УВЕДОМЛЕНИЕ КАК ПРОЧИТАННОЕ
        // ==========================================
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            int userId = GetCurrentUserId();

            var notification = await _context.Notifications.FindAsync(id);

            if (notification == null) return NotFound();
            if (notification.UsersId != userId) return Forbid("Это чужое уведомление.");

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok();
        }

        // ==========================================
        // 4. ОТМЕТИТЬ ВСЕ КАК ПРОЧИТАННЫЕ (Одной кнопкой)
        // ==========================================
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            int userId = GetCurrentUserId();

            var unreadNotifications = await _context.Notifications
                .Where(n => n.UsersId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notif in unreadNotifications)
            {
                notif.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return Ok("Все уведомления прочитаны.");
        }

        // ==========================================
        // 5. УДАЛИТЬ УВЕДОМЛЕНИЕ (Очистка мусора)
        // ==========================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            int userId = GetCurrentUserId();

            var notification = await _context.Notifications.FindAsync(id);

            if (notification == null) return NotFound();
            if (notification.UsersId != userId) return Forbid();

            _context.Notifications.Remove(notification); // Физическое удаление
            await _context.SaveChangesAsync();

            return Ok();
        }

        // ==========================================
        // 6. ОТПРАВИТЬ УВЕДОМЛЕНИЕ ВРУЧНУЮ (Только Админ)
        // ==========================================
        [HttpPost("send")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SendNotification([FromBody] NotificationSendDto dto)
        {
            // Теперь админ передает красивый JSON, а ошибки валидации отсекаются автоматически!

            var targetUser = await _context.Users.FindAsync(dto.TargetUserId);
            if (targetUser == null || targetUser.IsDeleted)
                return NotFound("Пользователь не найден.");

            var notification = new Notification
            {
                UsersId = dto.TargetUserId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Уведомление успешно отправлено пользователю." });
        }
    }
}
