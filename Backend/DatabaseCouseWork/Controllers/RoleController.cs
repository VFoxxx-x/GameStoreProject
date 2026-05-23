using DatabaseCouseWork.DTOs.Role;
using DatabaseCouseWork.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace DatabaseCouseWork.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly MydbContext _context;
        public RolesController(MydbContext context) { _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
            .Select(r => new RoleResponseDto
            {
                Id = r.Id,
                Name = r.Name
            })
            .ToListAsync();

            return Ok(roles);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] RoleCreateDto dto)
        {
            // Проверяем, нет ли уже такой роли
            var existingRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == dto.Name);
            if (existingRole != null)
                return BadRequest("Такая роль уже существует.");

            var role = new Role
            {
                Name = dto.Name
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Роль успешно создана!", roleId = role.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleCreateDto dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound("Роль не найдена.");

            // Защита от случайного переименования базовых ролей
            if (role.Name == "Admin" || role.Name == "User")
                return BadRequest("Нельзя переименовывать базовые системные роли.");

            role.Name = dto.Name;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Роль успешно обновлена." });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound("Роль не найдена.");

            if (role.Name == "Admin" || role.Name == "User")
                return BadRequest("Базовые системные роли удалять запрещено!");

            // ПРОВЕРКА: Есть ли пользователи с этой ролью?
            // В БД установлено ON DELETE RESTRICT для ролей.
            // Здесь мы перехватываем эту ошибку, чтобы сервер не выдал ошибку 500.
            bool hasUsers = await _context.Users.AnyAsync(u => u.RolesId == id);

            if (hasUsers)
                return BadRequest("Невозможно удалить роль, так как она назначена пользователям. Сначала измените роли этим пользователям.");

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Роль успешно удалена." });
        }
    }
}

