using DatabaseCouseWork.DTOs;
using DatabaseCouseWork.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DatabaseCouseWork.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeveloperController : ControllerBase
    {
        private readonly MydbContext _context;
        public DeveloperController(MydbContext context) { _context = context; }

        [HttpGet]
        [AllowAnonymous] // Читать могут все
        public async Task<IActionResult> GetDevelopers()
        {
            var dev = await _context.Developers
                .Select(d => new DeveloperResponseDto // dto
                {
                    Id = d.Id,
                    Title = d.Title,
                    Description = d.Description
                })
                .ToListAsync();

            return Ok(dev);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateDeveloper([FromBody] DeveloperCreateDto dto)
        {
            var dev = new Developer
            {
                Title = dto.Title,
                Description = dto.Description
            };

            _context.Developers.Add(dev);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Разработчик успешно создан.", devId = dev.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateDeveloper(int id, [FromBody] DeveloperCreateDto dto)
        {
            var developer = await _context.Developers.FindAsync(id);
            if (developer == null) return NotFound();

            developer.Title = dto.Title;
            developer.Description = dto.Description;
            // ... обновить другие нужные поля

            await _context.SaveChangesAsync();
            return Ok(new { message = "Рвзработчик успешно обновлен." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteDeveloper(int id)
        {
            var developer = await _context.Developers.FindAsync(id);
            if (developer == null) return NotFound();

            _context.Developers.Remove(developer); // ПОЛНОЕ удаление
            await _context.SaveChangesAsync();
            return Ok("Жанр удален.");
        }
    }
}
