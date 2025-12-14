using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.entities;
using projektas.Data.dto;
using projektas.Services;

namespace projektas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IPasswordHasher _passwordHasher;

        public AuthController(
            AppDbContext context,
            IJwtTokenService jwtTokenService,
            IPasswordHasher passwordHasher)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
            _passwordHasher = passwordHasher;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if user already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            // Check if username is taken
            var existingUsername = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (existingUsername != null)
            {
                return BadRequest(new { message = "Username is already taken" });
            }

            // Create new user
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                Password = _passwordHasher.HashPassword(request.Password),
                Role = UserRole.client, // Default role
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate token
            var token = _jwtTokenService.GenerateToken(user);
            var expiration = DateTime.UtcNow.AddMinutes(60);

            var response = new AuthResponseDto
            {
                Token = token,
                Expiration = expiration,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.ToString()
            };

            return Ok(response);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Find user by email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password
            if (!_passwordHasher.VerifyPassword(request.Password, user.Password))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Generate token
            var token = _jwtTokenService.GenerateToken(user);
            var expiration = DateTime.UtcNow.AddMinutes(60);

            var response = new AuthResponseDto
            {
                Token = token,
                Expiration = expiration,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.ToString()
            };

            return Ok(response);
        }

        // GET: api/auth/me
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId) || !long.TryParse(userId, out var id))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Don't return password
            user.Password = string.Empty;

            return Ok(user);
        }

        // POST: api/auth/create-or-update-client
        [HttpPost("create-or-update-client")]
        [Authorize]
        public async Task<ActionResult<long>> CreateOrUpdateClient([FromBody] ClientInfoDto clientInfo)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Check if client already exists
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId);

            if (client == null)
            {
                // Create new client
                client = new Client
                {
                    UserId = userId,
                    FullName = user.Username,
                    Address = clientInfo.Address,
                    PhoneNumber = clientInfo.PhoneNumber,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Clients.Add(client);
            }
            else
            {
                // Update existing client
                client.Address = clientInfo.Address;
                client.PhoneNumber = clientInfo.PhoneNumber;
                client.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { clientId = client.Id });
        }
    }
}

public class ClientInfoDto
{
    public string Address { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}
