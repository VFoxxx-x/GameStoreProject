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
    public class GenresController : ControllerBase
    {
        private readonly MydbContext _context;
        public GenresController(MydbContext context) { _context = context; }


        // ==========================================
        // 1. ПОЛУЧИТЬ ВСЕ ЖАНРЫ (Доступно всем гостям)
        // ==========================================

        [HttpGet]
        [AllowAnonymous] // Читать жанры могут все
        public async Task<IActionResult> GetGenres()
        {
            var genres = await _context.Genres
                .Select(g => new GenreResponseDto // dto
                {
                    Id = g.Id,
                    Title = g.Title,
                    Description = g.Description
                })
                .ToListAsync();

            return Ok(genres);
        }


        // ==========================================
        // 2. СОЗДАТЬ ЖАНР (Только Админ)
        // ==========================================
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateGenre([FromBody] GenreCreateDto dto)
        {
            var genre = new Genre
            {
                Title = dto.Title,
                Description = dto.Description
            };

            _context.Genres.Add(genre);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Жанр успешно создан!", genreId = genre.Id });
        }

        // ==========================================
        // 3. ИЗМЕНИТЬ ЖАНР (Только Админ)
        // ==========================================
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateGenre(int id, [FromBody] GenreCreateDto dto)
        {
            var genre = await _context.Genres.FindAsync(id);
            if (genre == null) return NotFound("Жанр не найден.");

            genre.Title = dto.Title;
            genre.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Жанр успешно обновлен." });
        }

        // ==========================================
        // 4. УДАЛИТЬ ЖАНР ФИЗИЧЕСКИ (Только Админ)
        // ==========================================
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteGenre(int id)
        {
            var genre = await _context.Genres.FindAsync(id);
            if (genre == null) return NotFound("Жанр не найден.");

            // Благодаря настройке ON DELETE CASCADE,
            // при удалении жанра база данных САМА удалит все его связи с играми из таблицы Game_Genre
            _context.Genres.Remove(genre);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Жанр удален." });
        }
    }
}
