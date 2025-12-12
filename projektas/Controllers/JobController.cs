using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.dto;
using projektas.Data.entities;

namespace projektas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Jobs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Job>>> GetAll()
        {
            var jobs = await _context.Jobs.ToListAsync();
            return Ok(jobs);
        }

        // GET: api/Jobs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Job>> Get(ulong id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null) return NotFound();
            return Ok(job);
        }

        // POST: api/Jobs
        [HttpPost]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Create([FromBody] JobDto dto)
        {
            if (dto == null)
                return BadRequest("Job data is required.");

            if (dto.Price <= 0)
                return BadRequest("Price must be greater than zero.");

            try
            {
                var job = new Job
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price
                };

                _context.Jobs.Add(job);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(Get), new { id = job.Id }, job);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, $"Database error: {ex.InnerException?.Message ?? ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Unexpected error: {ex.Message}");
            }
        }

        // PUT: api/Jobs/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin,manager")]
        public async Task<ActionResult> Update(ulong id, [FromBody] JobDto dto)
        {
            if (dto == null)
                return BadRequest("Job data is required.");

            if (dto.Price <= 0)
                return BadRequest("Price must be greater than zero.");

            var existing = await _context.Jobs.FindAsync(id);
            if (existing == null) return NotFound();

            try
            {
                existing.Name = dto.Name;
                existing.Description = dto.Description;
                existing.Price = dto.Price;

                _context.Entry(existing).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating job: {ex.Message}");
            }
        }

        // DELETE: api/Jobs/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> Delete(ulong id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null) return NotFound();

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
