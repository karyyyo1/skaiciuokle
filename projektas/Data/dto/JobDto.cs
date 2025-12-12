namespace projektas.Data.dto
{
    public class JobDto
    {
        public ulong Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
    }
}
