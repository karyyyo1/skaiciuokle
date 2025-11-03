namespace projektas.Data.dto
{
    public class CommentDto
    {
        public ulong? OrderId { get; set; }
        public ulong? DocumentId { get; set; }
        public ulong UserId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
