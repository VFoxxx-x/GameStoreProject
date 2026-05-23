using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatabaseCouseWork.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Загружать картинки могут только зарегистрированные
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        // Внедряем окружение, чтобы сервер знал, где находится папка wwwroot
        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile? file, [FromForm] string? oldPath)
        {
            // Оборачиваем всё в try-catch, чтобы сервер БОЛЬШЕ НИКОГДА НЕ ПАДАЛ!
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("Файл не выбран.");

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
                var extension = Path.GetExtension(file.FileName).ToLower();
                if (!allowedExtensions.Contains(extension))
                    return BadRequest("Разрешены только файлы JPG, PNG, GIF и WEBP.");

                string webRootPath = string.IsNullOrWhiteSpace(_env.WebRootPath)
                    ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
                    : _env.WebRootPath;

                string uploadsFolder = Path.Combine(webRootPath, "uploads");

                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // ========================================================
                // ОЧИСТКА: Удаляем старый файл, если он был передан!
                // ========================================================
                if (!string.IsNullOrWhiteSpace(oldPath))
                {
                    // Защита: Path.GetFileName оставит только имя файла (например, 123.jpg),
                    
                    var oldFileName = Path.GetFileName(oldPath);
                    var oldFilePath = Path.Combine(uploadsFolder, oldFileName);

                    // Если старый файл физически существует -  удаляем его
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        System.IO.File.Delete(oldFilePath);
                    }
                }

                // Создаем и сохраняем НОВЫЙ файл
                string newFileName = Guid.NewGuid().ToString() + extension;
                string filePath = Path.Combine(uploadsFolder, newFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                return Ok(new { url = $"/uploads/{newFileName}" });
            }
            catch (Exception ex)
            {
                // Если что-то сломается (например, файл занят другим процессом),
                // процесс не умрет с кодом -1, а вернет на фронтенд 500 ошибку с причиной!
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }
    }
}

