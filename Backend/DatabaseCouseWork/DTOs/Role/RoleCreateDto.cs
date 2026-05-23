using System.ComponentModel.DataAnnotations;

namespace DatabaseCouseWork.DTOs.Role
{
    public class RoleCreateDto
    {
        [Required(ErrorMessage = "Название роли обязательно.")]
        [MaxLength(50, ErrorMessage = "Название роли не может превышать 50 символов.")]
        public string Name { get; set; } = null!;
    }
}
