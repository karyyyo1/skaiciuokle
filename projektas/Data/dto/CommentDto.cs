namespace projektas.Data.dto
{
    public class CommentDto
    {
        public long? OrderId { get; set; }
        public long? DocumentId { get; set; }
        public long UserId { get; set; }
        public string Text { get; set; } = string.Empty;
    }
}
