namespace projektas.Data.dto
{
    public class DocumentDto
    {
        public ulong OrderId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
    }
    public class DocumentResponseDto
    {
        public ulong Id { get; set; }
        public ulong OrderId { get; set; }
        public string Name { get; set; }
        public string FilePath { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
