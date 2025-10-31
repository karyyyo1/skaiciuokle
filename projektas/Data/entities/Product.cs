using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace projektas.Data.entities
{
    // Enums remain the same
    public enum ProductType
    {
        none = 0,
        access_control = 1,
        gate_engine = 2,
        poles = 3,
        fence = 4,
        gate = 5,
        gadgets = 6,
        jobs = 7
    }

    public enum GateType
    {
        push = 1,
        two_gates = 2
    }

    public enum FenceType
    {
        sukos = 1,
        segmentas = 2,
        polisadas = 3,
        skarda = 4
    }

    // --- Base Product Class ---
    [Table("products")]
    public abstract class Product
    {
        [Key]
        [Column("id")]
        public ulong Id { get; set; } // bigint(20) UNSIGNED

        [Required]
        [Column("name")]
        public string Name { get; set; } = string.Empty; // varchar(255) NOT NULL

        [Column("description")]
        public string? Description { get; set; } // varchar(1000) DEFAULT NULL

        [Required]
        [Column("price")]
        [Precision(10, 2)]
        public decimal Price { get; set; } // decimal(10,2) NOT NULL

        [Required]
        [Column("type")]
        public ProductType Type { get; protected set; } // enum('...') NOT NULL

        // --- Common/Nullable Properties for the TPH table ---

        [Column("width")]
        public int? Width { get; set; } // int(11) DEFAULT NULL

        [Column("length")]
        public int? Length { get; set; } // int(11) DEFAULT NULL

        [Column("height")]
        public int? Height { get; set; } // int(11) DEFAULT NULL

        [Column("connection")]
        public string? Connection { get; set; } // varchar(255) DEFAULT NULL

        [Column("relays")]
        public int? Relays { get; set; } // int(11) DEFAULT NULL

        [Column("quantity")]
        public int? Quantity { get; set; } // int(11) DEFAULT NULL

        [Column("color")]
        public string? Color { get; set; } // varchar(100) DEFAULT NULL
    }
    public class Jobs : Product
    {
        public Jobs() => Type = ProductType.jobs;
    }

    public class AccessControl : Product
    {
        public AccessControl() => Type = ProductType.access_control;
    }

    public class GateEngine : Product
    {
        public GateEngine() => Type = ProductType.gate_engine;

        [Column("gatetype")]
        public GateType? GateType { get; set; } // Mapped from your 'gatetype'

        [Column("fast")]
        public bool? Fast { get; set; } // Mapped from your 'fast' (assuming tinyint(1))
    }

    public class Pole : Product
    {
        public Pole() => Type = ProductType.poles;
    }

    public class Gate : Product
    {
        public Gate() => Type = ProductType.gate;

        // Width, Length, and Height are in the base Product

        [Column("gatetype")]
        public GateType? GateType { get; set; } // Mapped from your 'gatetype'
    }

    public class Gadget : Product
    {
        public Gadget() => Type = ProductType.gadgets;

        [Column("connection")]
        public string? Connection { get; set; } // Mapped from your 'connection'

        [Column("relays")]
        public int? Relays { get; set; } // Mapped from your 'relays'
    }

    public class Fence : Product
    {
        public Fence() => Type = ProductType.fence;

        [Column("filltype")]
        public FenceType? FillType { get; set; } // Mapped from your 'filltype'
    }
}