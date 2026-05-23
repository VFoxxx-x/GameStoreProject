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
    [Authorize] // Контроллер доступен ЛЮБОМУ авторизованному пользователю
    public class ProfileController : ControllerBase
    {
        private readonly MydbContext _context;

        public ProfileController(MydbContext context)
        {
            _context = context;
        }

        // Берем ID текущего юзера из JWT-токена
        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // ==========================================
        // 1. ПОЛУЧИТЬ ДАННЫЕ СВОЕГО ПРОФИЛЯ
        // ==========================================
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            int userId = GetCurrentUserId();

            var user = await _context.Users
                .Include(u => u.Roles) // Обязательно подгружаем Роль!
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.IsDeleted)
                return NotFound("Пользователь не найден.");

            var responseDto = new ProfileResponseDto
            {
                Username = user.Name,
                Email = user.Email,
                ImagePath = user.ImagePath, // для аватарки
                RoleName = user.Roles.Name,
                IsAdmin = user.Roles.Name == "Admin", // Если он админ, вернет true
                CreatedAt = user.CreatedAt
            };

            return Ok(responseDto);
        }

        // ==========================================
        // 2. ОБНОВИТЬ СВОИ ДАННЫЕ (Имя, Аватарка)
        // ==========================================
        [HttpPut("me/edit")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] ProfileUpdateDto dto)
        {
            try {
            int userId = GetCurrentUserId();

            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.IsDeleted)
                return NotFound("Пользователь не найден.");

            // Проверка: не занял ли кто-то уже такой Username? (исключая самого себя)
            var isUsernameTaken = await _context.Users
                .AnyAsync(u => u.Name == dto.Username && u.Id != userId);

            if (isUsernameTaken)
                return BadRequest("Это имя пользователя уже занято кем-то другим.");

            // Применяем изменения
            user.Name = dto.Username;
            user.ImagePath = dto.ImagePath;
            // другие данные...

            await _context.SaveChangesAsync();

            return Ok(new { message = "Профиль успешно обновлен!" });
            }
            catch (Exception ex)
            {
                // Логируем исключение в консоль и возвращаем 500
                Console.WriteLine($"Ошибка при обновлении профиля: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, "Внутренняя ошибка сервера");
            }
        }
    }
}
