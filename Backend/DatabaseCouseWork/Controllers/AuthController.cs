using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DatabaseCouseWork.Models;
using DatabaseCouseWork.DTOs;

namespace DatabaseCouseWork.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MydbContext _context;
        private readonly IConfiguration _config;

        public AuthController(MydbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email уже занят.");

            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");

            var user = new User
            {
                Name = dto.Username, // Берем из DTO
                Email = dto.Email,       // Берем из DTO
                RolesId = userRole?.Id ?? 1,
                IsBanned = false,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

            var hasher = new PasswordHasher<User>();
            user.PasswordHash = hasher.HashPassword(user, dto.Password); 

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok("Успешная регистрация");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Email == dto.Email); // Ищем по DTO

            if (user == null || user.IsDeleted) return Unauthorized("Пользователь не найден.");
            if (user.IsBanned) return Forbid("Ваш аккаунт заблокирован.");

            var hasher = new PasswordHasher<User>();
            if (hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password) != PasswordVerificationResult.Success)
                return Unauthorized("Неверный пароль.");

            // Генерация токена остается прежней...
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("nameid", user.Id.ToString()), // Коротко и ясно
                new Claim("name", user.Name),
                new Claim("role", user.Roles.Name)        // Идеально!
            };

            var token = new JwtSecurityToken(_config["Jwt:Issuer"], _config["Jwt:Audience"],
                claims, expires: DateTime.Now.AddDays(7), signingCredentials: credentials);

            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }
    }
}
