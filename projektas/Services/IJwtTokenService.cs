using projektas.Data.entities;

namespace projektas.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
    }
}
