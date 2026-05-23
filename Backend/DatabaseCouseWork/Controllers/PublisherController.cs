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
    public class PublishersController : ControllerBase
    {
        private readonly MydbContext _context;
        public PublishersController(MydbContext context) { _context = context; }

        [HttpGet]
        [AllowAnonymous] // Читать жанры могут все
        public async Task<IActionResult> GetPublishers()
        {
            var publishers = await _context.Publishers
            .Select(g => new PublisherResponseDto // <--- Спасаемся от бесконечных циклов!
            {
                Id = g.Id,
                Title = g.Title,
                Description = g.Description
            })
            .ToListAsync();

            return Ok(publishers);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePublisher([FromBody] PublisherCreateDto dto)
        {
            var publisher = new Publisher
            {
                Title = dto.Title,
                Description = dto.Description
            };

            _context.Publishers.Add(publisher);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Жанр успешно создан!", publisherId = publisher.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePublisher(int id, [FromBody] PublisherCreateDto dto)
        {
            var publisher = await _context.Publishers.FindAsync(id);
            if (publisher == null) return NotFound();

            publisher.Title = dto.Title;
            publisher.Description = dto.Description;
            // ... обновить другие нужные поля

            await _context.SaveChangesAsync();
            return Ok(publisher);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePublisher(int id)
        {
            var publisher = await _context.Publishers.FindAsync(id);
            if (publisher == null) return NotFound();

            _context.Publishers.Remove(publisher); // ПОЛНОЕ удаление
            await _context.SaveChangesAsync();
            return Ok("Жанр удален.");
        }
    }
}
