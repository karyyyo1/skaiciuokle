using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.entities;
using projektas.Services;

namespace projektas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Allow all authenticated users
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public UsersController(AppDbContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        // GET: api/users
        [HttpGet]
        [Authorize(Roles = "admin,manager")] // Allow admins and managers to list users
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // GET: api/users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(ulong id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        // POST: api/users
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser([FromBody] User user)
        {
            if (user == null) return BadRequest();

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        // PUT: api/users/5
        [HttpPut("{id}")]
        [Authorize] // Allow any authenticated user
        public async Task<IActionResult> UpdateUser(ulong id, [FromBody] UpdateUserDto dto)
        {
            // Debug: Print all claims
            Console.WriteLine("=== All Claims in Token ===");
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"  {claim.Type}: {claim.Value}");
            }
            Console.WriteLine("===========================");
            
            // Try multiple ways to get user ID from claims
            var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                ?? User.FindFirst("role")?.Value;
            
            Console.WriteLine($"UpdateUser - Requested ID: {id}, Token User ID: {currentUserIdClaim}, Role: {currentUserRole}");
            
            // Parse user ID from token
            if (string.IsNullOrEmpty(currentUserIdClaim) || !ulong.TryParse(currentUserIdClaim, out var currentUserId))
            {
                Console.WriteLine("ERROR: Could not parse user ID from token");
                return Unauthorized("Invalid user ID in token");
            }
            
            // Check if user is admin (case-insensitive)
            bool isAdmin = currentUserRole != null && 
                (currentUserRole.Equals("admin", StringComparison.OrdinalIgnoreCase) || 
                 currentUserRole == "1");
            
            // Users can only update their own profile unless they're admin
            if (currentUserId != id && !isAdmin)
            {
                Console.WriteLine($"Forbidden: User {currentUserId} (role: {currentUserRole}) trying to update user {id}");
                return Forbid();
            }
            
            Console.WriteLine($"Authorized: User {currentUserId} (role: {currentUserRole}) updating user {id}");

            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null) return NotFound();

            // Update only username (users can't change their own role or email through this endpoint)
            if (!string.IsNullOrWhiteSpace(dto.Username))
            {
                existingUser.Username = dto.Username;
            }
            
            existingUser.UpdatedAt = DateTime.UtcNow;

            _context.Entry(existingUser).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            Console.WriteLine($"Successfully updated username for user {id}");
            return NoContent();
        }

        // PUT: api/users/5/password
        [HttpPut("{id}/password")]
        [Authorize] // Allow any authenticated user
        public async Task<IActionResult> UpdatePassword(ulong id, [FromBody] UpdatePasswordDto dto)
        {
            // Try multiple ways to get user ID from claims
            var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            Console.WriteLine($"UpdatePassword - Requested ID: {id}, Token User ID: {currentUserIdClaim}");
            
            // Parse user ID from token
            if (string.IsNullOrEmpty(currentUserIdClaim) || !ulong.TryParse(currentUserIdClaim, out var currentUserId))
            {
                Console.WriteLine("ERROR: Could not parse user ID from token");
                return Unauthorized("Invalid user ID in token");
            }
            
            // Users can only update their own password
            if (currentUserId != id)
            {
                Console.WriteLine($"Forbidden: User {currentUserId} trying to update password for user {id}");
                return Forbid();
            }
            
            Console.WriteLine($"Authorized: User {currentUserId} updating their own password");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Verify current password
            if (!_passwordHasher.VerifyPassword(dto.CurrentPassword, user.Password))
            {
                return BadRequest("Current password is incorrect");
            }

            // Validate new password
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            {
                return BadRequest("New password must be at least 6 characters");
            }

            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest("New password and confirmation do not match");
            }

            // Hash and update password
            user.Password = _passwordHasher.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/users/5/role
        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(ulong id, [FromBody] UpdateRoleDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Validate role
            if (dto.Role < 1 || dto.Role > 3)
                return BadRequest("Invalid role. Must be 1 (Admin), 2 (Manager), or 3 (Client)");

            var oldRole = user.Role;
            var newRole = (UserRole)dto.Role;

            // Update user role
            user.Role = newRole;
            user.UpdatedAt = DateTime.UtcNow;

            // Handle role-specific table entries
            if (newRole == UserRole.manager && oldRole != UserRole.manager)
            {
                // User is being promoted to manager - create manager entry if it doesn't exist
                var existingManager = await _context.Manager.FirstOrDefaultAsync(m => m.UserId == id);
                if (existingManager == null)
                {
                    var manager = new Manager
                    {
                        UserId = id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Manager.Add(manager);
                }
            }
            else if (oldRole == UserRole.manager && newRole != UserRole.manager)
            {
                // User is being demoted from manager - remove manager entry
                var existingManager = await _context.Manager.FirstOrDefaultAsync(m => m.UserId == id);
                if (existingManager != null)
                {
                    _context.Manager.Remove(existingManager);
                }
            }

            // Handle admin role
            if (newRole == UserRole.admin && oldRole != UserRole.admin)
            {
                // User is being promoted to admin - create admin entry if it doesn't exist
                var existingAdmin = await _context.Administrators.FirstOrDefaultAsync(a => a.UserId == id);
                if (existingAdmin == null)
                {
                    var admin = new Administrator
                    {
                        UserId = id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Administrators.Add(admin);
                }
            }
            else if (oldRole == UserRole.admin && newRole != UserRole.admin)
            {
                // User is being demoted from admin - remove admin entry
                var existingAdmin = await _context.Administrators.FirstOrDefaultAsync(a => a.UserId == id);
                if (existingAdmin != null)
                {
                    _context.Administrators.Remove(existingAdmin);
                }
            }

            // Handle client role
            if (newRole == UserRole.client && oldRole != UserRole.client)
            {
                // User is being set to client - create client entry if it doesn't exist
                var existingClient = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == id);
                if (existingClient == null)
                {
                    var client = new Client
                    {
                        UserId = id,
                        FullName = user.Username, // Default to username
                        Address = "",
                        PhoneNumber = "",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Clients.Add(client);
                }
            }
            else if (oldRole == UserRole.client && newRole != UserRole.client)
            {
                // User is being changed from client - remove client entry
                var existingClient = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == id);
                if (existingClient != null)
                {
                    _context.Clients.Remove(existingClient);
                }
            }

            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(ulong id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class UpdateRoleDto
    {
        public int Role { get; set; }
    }

    public class UpdateUserDto
    {
        public string? Username { get; set; }
    }

    public class UpdatePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
