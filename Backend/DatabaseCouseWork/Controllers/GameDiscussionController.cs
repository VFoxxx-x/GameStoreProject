using DatabaseCouseWork.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using DatabaseCouseWork.DTOs;

namespace DatabaseCouseWork.Controllers
{
   
    [Route("api/[controller]")]
    [ApiController]
    public class GameDiscussionsController : ControllerBase
    {
        private readonly MydbContext _context;

        public GameDiscussionsController(MydbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        }

        // ПОЛУЧИТЬ ВСЕ КОММЕНТАРИИ (С ОТВЕТАМИ)
        [HttpGet("game/{gameId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDiscussionsForGame(int gameId)
        {
            var comments = await _context.GameDiscussions
                .Where(d => d.GamesId == gameId && d.ParentId == null) // БЕРЕМ ТОЛЬКО ГЛАВНЫЕ КОММЕНТАРИИ
                .OrderByDescending(d => d.CreatedAt) // Новые сверху
                .Select(d => new GameDiscussionResponseDto
                {
                    CommentId = d.Id,
                    AuthorName = d.Users.IsDeleted ? "[Удаленный пользователь]" : d.Users.Name,
                    Message = d.Message,
                    CreatedAt = d.CreatedAt,

                    // МАГИЯ EF CORE: Подтягиваем ответы прямо внутри запроса!
                    Replies = _context.GameDiscussions
                        .Where(r => r.ParentId == d.Id) // Ищем ответы на ЭТОТ комментарий
                        .OrderBy(r => r.CreatedAt) // Ответы обычно идут хронологически (старые сверху)
                        .Select(r => new GameDiscussionResponseDto
                        {
                            CommentId = r.Id,
                            AuthorName = r.Users.IsDeleted ? "[Удаленный пользователь]" : r.Users.Name,
                            Message = r.Message,
                            CreatedAt = r.CreatedAt
                        }).ToList()
                })
                .ToListAsync();

            return Ok(comments);
        }

        // НАПИСАТЬ КОММЕНТАРИЙ ИЛИ ОТВЕТ
        [HttpPost("{gameId}")]
        [Authorize]
        public async Task<IActionResult> PostComment(int gameId, [FromBody] GameDiscussionCreateDto dto)
        {
            int userId = GetCurrentUserId();

            var discussion = new GameDiscussion
            {
                GamesId = gameId,
                UsersId = userId,
                Message = dto.Message,
                ParentId = dto.ParentId, // <--- Сохраняем связь, если это ответ
                CreatedAt = DateTime.UtcNow
            };

            _context.GameDiscussions.Add(discussion);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Комментарий успешно добавлен!" });
        }

        // ==========================================
        // 3. УДАЛИТЬ КОММЕНТАРИЙ (Автор или Админ)
        // ==========================================
        [HttpDelete("{commentId}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var comment = await _context.GameDiscussions.FindAsync(commentId);
            if (comment == null) return NotFound("Комментарий не найден.");

            int userId = GetCurrentUserId();
            bool isAdmin = User.IsInRole("Admin");

            // ПРОВЕРКА ПРАВ: Удалить может только автор комментария ИЛИ Администратор
            if (comment.UsersId != userId && !isAdmin)
            {
                return Forbid("У вас нет прав для удаления этого комментария.");
            }

            _context.GameDiscussions.Remove(comment); // Физическое удаление (мусор нам не нужен)

            // Бонус: Если коммент удалил админ, отправляем автору предупреждение
            if (isAdmin && comment.UsersId != userId)
            {
                _context.Notifications.Add(new Notification
                {
                    UsersId = comment.UsersId,
                    Type = "Warning",
                    Title = "Удаление комментария",
                    Message = $"Ваш комментарий был удален модератором за нарушение правил.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok("Комментарий удален.");
        }
    }
}
