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
    [Authorize(Roles = "Admin")] // Весь этот контроллер доступен ТОЛЬКО админам
    public class UsersController : ControllerBase
    {
        private readonly MydbContext _context;
        public UsersController(MydbContext context) { _context = context; }

        // ==========================================
        // ПРОСМОТР ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (Без паролей!)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Include(u => u.Roles) // Подгружаем роль, чтобы узнать её название
                .Where(u => !u.IsDeleted)
                .Select(u => new UserResponseDto // Мапим в наш безопасный DTO
                {
                    Id = u.Id,
                    Username = u.Name,
                    Email = u.Email,
                    RoleName = u.Roles.Name, // Достаем слово "Admin" или "User"
                    IsBanned = u.IsBanned,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // Забанить / Разбанить
        [HttpPut("toggle-ban/{id}")]
        public async Task<IActionResult> ToggleBan(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.IsDeleted) return NotFound();

            user.IsBanned = !user.IsBanned;
            await _context.SaveChangesAsync();
            return Ok(new { message = user.IsBanned ? "Пользователь забанен." : "Пользователь разбанен." });
        }

        // Мягкое удаление пользователя
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.IsDeleted) return NotFound();

            user.IsDeleted = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Пользователь удален." });
        }

        // Повышение до Админа
        [HttpPut("promote/{id}")]
        public async Task<IActionResult> PromoteToAdmin(int id)
        {
            var targetUser = await _context.Users.FindAsync(id);
            if (targetUser == null || targetUser.IsDeleted) return NotFound();

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");

            if (targetUser.RolesId == adminRole!.Id)
                return BadRequest("Пользователь уже Администратор.");

            targetUser.RolesId = adminRole.Id;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Права Администратора успешно выданы." });
        }
    }
}