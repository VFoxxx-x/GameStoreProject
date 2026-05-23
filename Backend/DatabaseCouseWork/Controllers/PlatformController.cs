using DatabaseCouseWork.DTOs;
using DatabaseCouseWork.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DatabaseCouseWork.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Весь этот контроллер доступен ТОЛЬКО админам
    public class PlatformController : Controller
    {
        private readonly MydbContext _context;
        public PlatformController(MydbContext context) { _context = context; }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPlatforms()
        {
            var platforms = await _context.Platforms
            .Select(p => new PlatformResponseDto // <--- Спасаемся от бесконечных циклов!
            {
                Id = p.Id,
                Title = p.Title,
                Type = p.Type
            })
            .ToListAsync();

            return Ok(platforms);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePlatform([FromBody] PlatformCreateDto dto)
        {
            var platform = new Platform
            {
                Title = dto.Title,
                Type = dto.Type
            };

            _context.Platforms.Add(platform);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Жанр успешно создан!", platformId = platform.Id });
        }
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePlatform(int id, [FromBody] PlatformCreateDto dto)
        {
            var platform = await _context.Platforms.FindAsync(id);
            if (platform == null) return NotFound();

            platform.Title = dto.Title;
            platform.Type = dto.Type;
            // ... обновить другие нужные поля

            await _context.SaveChangesAsync();
            return Ok(platform);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePlatform(int id)
        {
            var platform = await _context.Platforms.FindAsync(id);
            if (platform == null) return NotFound();

            _context.Platforms.Remove(platform); // ПОЛНОЕ удаление
            await _context.SaveChangesAsync();
            return Ok("Платформа удалена.");
        }
    }

}
