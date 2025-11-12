using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using projektas.Data;
using projektas.Data.entities;
using projektas.Data.dto;

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
        public async Task<ActionResult<Comment>> CreateComment([FromBody] CommentDto dto)
        {
            if (dto == null) return BadRequest();

            if (string.IsNullOrWhiteSpace(dto.Text)) return BadRequest("Text is required");

            // Exactly one parent: Order OR Document must be set
            var hasOrder = dto.OrderId.HasValue;
            var hasDocument = dto.DocumentId.HasValue;
            if (hasOrder == hasDocument) // both true or both false
                return BadRequest("Provide exactly one parent: either OrderId or DocumentId");

            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
            if (!userExists) return BadRequest("UserId does not exist");

            if (hasOrder)
            {
                var orderExists = await _context.Orders.AnyAsync(o => o.Id == dto.OrderId!.Value);
                if (!orderExists) return BadRequest("OrderId does not exist");
            }

            if (hasDocument)
            {
                var docExists = await _context.Documents.AnyAsync(d => d.Id == dto.DocumentId!.Value);
                if (!docExists) return BadRequest("DocumentId does not exist");
            }

            var comment = new Comment
            {
                UserId = dto.UserId,
                OrderId = dto.OrderId,
                DocumentId = dto.DocumentId,
                Text = dto.Text,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComment), new { id = comment.Id }, comment);
        }

        // PUT: api/comments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComment(ulong id, [FromBody] CommentDto dto)
        {
            if (dto == null) return BadRequest();

            var existingComment = await _context.Comments.FindAsync(id);
            if (existingComment == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Text)) return BadRequest("Text is required");

            // Exactly one parent: Order OR Document must be set
            var hasOrder = dto.OrderId.HasValue;
            var hasDocument = dto.DocumentId.HasValue;
            if (hasOrder == hasDocument) // both true or both false
                return BadRequest("Provide exactly one parent: either OrderId or DocumentId");

            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
            if (!userExists) return BadRequest("UserId does not exist");

            if (hasOrder)
            {
                var orderExists = await _context.Orders.AnyAsync(o => o.Id == dto.OrderId!.Value);
                if (!orderExists) return BadRequest("OrderId does not exist");
            }

            if (hasDocument)
            {
                var docExists = await _context.Documents.AnyAsync(d => d.Id == dto.DocumentId!.Value);
                if (!docExists) return BadRequest("DocumentId does not exist");
            }

            // Update fields
            existingComment.Text = dto.Text;
            existingComment.UserId = dto.UserId;
            existingComment.OrderId = dto.OrderId;
            existingComment.DocumentId = dto.DocumentId;
            existingComment.UpdatedAt = DateTime.UtcNow;

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