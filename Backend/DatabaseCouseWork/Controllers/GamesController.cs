using DatabaseCouseWork.DTOs;
using DatabaseCouseWork.DTOs.Game;
using DatabaseCouseWork.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DatabaseCouseWork.Controllers
{
   
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // По умолчанию доступно всем авторизованным с валидным JWT
    public class GamesController : ControllerBase
    {
        private readonly MydbContext _context;
        public GamesController(MydbContext context) { _context = context; }

        // GET: api/Games - Видят все. Показываем только НЕ удаленные
        // ==========================================
    // ПОЛУЧИТЬ СПИСОК ИГР (С ФИЛЬТРАМИ И ПОИСКОМ)
    // ==========================================
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetGames(
        [FromQuery] string? search,
        [FromQuery] int? genreId,
        [FromQuery] int? platformId,
        [FromQuery] int? developerId,
        [FromQuery] int? publisherId,
        [FromQuery] int? maxAgeRating,
        [FromQuery] int? releaseYear,
        [FromQuery] string? sortBy)
    {
        // 1. Начинаем строить запрос (пока не отправляем его в базу)
        var query = _context.Games
            .Include(g => g.Genres)
            .Include(g => g.Platforms)
            .Include(g => g.Developers)
            .Include(g => g.Publishers)
            .Where(g => !g.IsDeleted)
            .AsQueryable();

        // 2. Применяем фильтры (если они переданы)
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(g => g.Title.Contains(search));

        if (genreId.HasValue)
            query = query.Where(g => g.Genres.Any(genre => genre.Id == genreId.Value));

        if (platformId.HasValue)
            query = query.Where(g => g.Platforms.Any(p => p.Id == platformId.Value));

        if (developerId.HasValue)
            query = query.Where(g => g.Developers.Any(d => d.Id == developerId.Value));

        if (publisherId.HasValue)
            query = query.Where(g => g.Publishers.Any(p => p.Id == publisherId.Value));

        if (maxAgeRating.HasValue)
            query = query.Where(g => g.AgeRating <= maxAgeRating.Value); // Ищем игры, подходящие под возраст

        if (releaseYear.HasValue)
            query = query.Where(g => g.ReleaseDate.HasValue && g.ReleaseDate.Value.Year == releaseYear.Value);

        // 3. Применяем сортировку
        if (sortBy == "newest")
            query = query.OrderByDescending(g => g.ReleaseDate);
        else
            query = query.OrderBy(g => g.Title); // По умолчанию сортируем по алфавиту

            // 4. Выполняем запрос к БД и мапим в DTO
            var games = await query.Select(g => new GameResponseDto
            {
                Id = g.Id,
                Title = g.Title,
                Price = g.Price,
                ImagePath = g.ImagePath, // Не забываем обложку!

                // ЗАПОЛНЯЕМ ID ДЛЯ АДМИНКИ
                GenreIds = g.Genres.Select(x => x.Id).ToList(),
                PlatformIds = g.Platforms.Select(x => x.Id).ToList(),
                DeveloperIds = g.Developers.Select(x => x.Id).ToList(),
                PublisherIds = g.Publishers.Select(x => x.Id).ToList(),

                // ЗАПОЛНЯЕМ НАЗВАНИЯ ДЛЯ КАТАЛОГА НА ГЛАВНОЙ
                GenreNames = g.Genres.Select(x => x.Title).ToList(),
                PlatformNames = g.Platforms.Select(x => x.Title).ToList(),
                DeveloperNames = g.Developers.Select(x => x.Title).ToList(),
                PublisherNames = g.Publishers.Select(x => x.Title).ToList()
            }).ToListAsync();

            return Ok(games);

            return Ok(games);
    }

        // POST: api/Games - Только Админ
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateGame([FromBody] GameCreateDto dto)
        {
            // 1. Создаем настоящую игру для базы данных
            var newGame = new Game
            {
                Title = dto.Title,
                Price = dto.Price,
                AgeRating = dto.AgeRating,
                ReleaseDate = dto.ReleaseDate,
                Description = dto.Description,
                ImagePath = dto.ImagePath,
                SystemRequirements = dto.SystemRequirements,

                IsDeleted = false // Жестко задаем, что новая игра не удалена
            };

            if (dto.GenreIds != null && dto.GenreIds.Any())
            {
                var genres = await _context.Genres.Where(g => dto.GenreIds.Contains(g.Id)).ToListAsync();
                foreach (var g in genres) newGame.Genres.Add(g);
            }

            if (dto.PlatformIds != null && dto.PlatformIds.Any())
            {
                var genres = await _context.Platforms.Where(g => dto.PlatformIds.Contains(g.Id)).ToListAsync();
                foreach (var g in genres) newGame.Platforms.Add(g);
            }

            if (dto.DeveloperIds != null && dto.DeveloperIds.Any())
            {
                var genres = await _context.Developers.Where(g => dto.DeveloperIds.Contains(g.Id)).ToListAsync();
                foreach (var g in genres) newGame.Developers.Add(g);
            }

            if (dto.PublisherIds != null && dto.PublisherIds.Any())
            {
                var genres = await _context.Publishers.Where(g => dto.PublisherIds.Contains(g.Id)).ToListAsync();
                foreach (var g in genres) newGame.Publishers.Add(g);
            }

            // 2. Сохраняем в базу
            _context.Games.Add(newGame);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Игра успешно добавлена!", gameId = newGame.Id });
        }

        // PUT: api/Games/5 - Только Админ
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateGame(int id, [FromBody] GameCreateDto dto)
        {
            var game = await _context.Games
                .Include(g => g.Genres)
                .Include(g => g.Platforms)
                .Include(g => g.Developers)
                .Include(g => g.Publishers)
                .FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted);

            if (game == null) return NotFound("Игра не найдена.");

            game.Title = dto.Title;
            game.Price = dto.Price;
            game.Description = dto.Description;
            game.AgeRating = dto.AgeRating;
            game.ReleaseDate = dto.ReleaseDate;
            game.ImagePath = dto.ImagePath;
            game.SystemRequirements = dto.SystemRequirements;
            // ... обновить другие нужные поля

            game.Genres.Clear();
            if (dto.GenreIds != null && dto.GenreIds.Any())
            {
                var genres = await _context.Genres.Where(g => dto.GenreIds.Contains(g.Id)).ToListAsync();
                foreach (var g in genres) game.Genres.Add(g);
            }

            game.Platforms.Clear();
            if (dto.PlatformIds != null && dto.PlatformIds.Any())
            {
                var platforms = await _context.Platforms.Where(p => dto.PlatformIds.Contains(p.Id)).ToListAsync();
                foreach (var p in platforms) game.Platforms.Add(p);
            }

            game.Developers.Clear();
            if (dto.DeveloperIds != null && dto.DeveloperIds.Any())
            {
                var developers = await _context.Developers.Where(p => dto.DeveloperIds.Contains(p.Id)).ToListAsync();
                foreach (var p in developers) game.Developers.Add(p);
            }

            game.Publishers.Clear();
            if (dto.PublisherIds != null && dto.PublisherIds.Any())
            {
                var publishers = await _context.Publishers.Where(p => dto.PublisherIds.Contains(p.Id)).ToListAsync();
                foreach (var p in publishers) game.Publishers.Add(p);
            }

            await _context.SaveChangesAsync();
            return Ok(game);
        }

        // DELETE: api/Games/5 - Только Админ (МЯГКОЕ УДАЛЕНИЕ)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteGame(int id)
        {
            var game = await _context.Games.FindAsync(id);
            if (game == null || game.IsDeleted) return NotFound();

            game.IsDeleted = true; // Вместо _context.Games.Remove(game);
            await _context.SaveChangesAsync();

            return Ok("Игра перемещена в корзину (удалена).");
        }

        // ПОЛУЧИТЬ ОДНУ ИГРУ (Для страницы Game Details)
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetGame(int id)
        {
            var game = await _context.Games
            .Include(g => g.Genres)
            .Include(g => g.Platforms)
            .Include(g => g.Developers)
            .Include(g => g.Publishers)
            .FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted);

            if (game == null) return NotFound("Игра не найдена.");

            var responseDto = new GameDetailsResponseDto
            {
                Id = game.Id,
                Title = game.Title,
                Price = game.Price,
                AgeRating = game.AgeRating,
                ReleaseDate = game.ReleaseDate,
                Description = game.Description,
                ImagePath = game.ImagePath,

                GenreNames = game.Genres.Select(x => x.Title).ToList(),
                PlatformNames = game.Platforms.Select(x => x.Title).ToList(),
                DeveloperNames = game.Developers.Select(x => x.Title).ToList(),
                PublisherNames = game.Publishers.Select(x => x.Title).ToList(),
            };

            return Ok(responseDto);
        }
    }
}
