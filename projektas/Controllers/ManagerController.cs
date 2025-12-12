using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.entities;

namespace projektas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ManagerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ManagerController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/manager
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Manager>>> GetManagers()
        {
            return await _context.Manager
                .Include(m => m.User)
                .ToListAsync();
        }

        // GET: api/manager/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Manager>> GetManager(ulong id)
        {
            var manager = await _context.Manager
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (manager == null) return NotFound();
            return Ok(manager);
        }
    }
}
