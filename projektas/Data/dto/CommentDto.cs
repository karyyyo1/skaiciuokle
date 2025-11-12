namespace projektas.Data.dto
{
    public class CommentDto
    {
        public ulong? OrderId { get; set; }
        public ulong? DocumentId { get; set; }
        public ulong UserId { get; set; }
        public string Text { get; set; } = string.Empty;
    }
}
