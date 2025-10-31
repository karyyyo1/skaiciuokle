using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.entities;

namespace projektas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CommentsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/comments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments()
        {
            return await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Order)
                .Include(c => c.Document)
                .ToListAsync();
        }

        // GET: api/comments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Comment>> GetComment(ulong id)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Order)
                .Include(c => c.Document)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null) return NotFound();
            return Ok(comment);
        }
        // POST: api/comments
        [HttpPost]
        public async Task<ActionResult<Comment>> CreateComment([FromBody] Comment comment)
        {
            if (comment == null) return BadRequest();

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComment), new { id = comment.Id }, comment);
        }

        // PUT: api/comments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComment(ulong id, [FromBody] Comment comment)
        {
            if (id != comment.Id) return BadRequest("ID mismatch");

            var existingComment = await _context.Comments.FindAsync(id);
            if (existingComment == null) return NotFound();

            // Update fields
            existingComment.Text = comment.Text;
            existingComment.UserId = comment.UserId;
            existingComment.OrderId = comment.OrderId;
            existingComment.DocumentId = comment.DocumentId;

            _context.Entry(existingComment).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/comments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(ulong id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return NotFound();

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}