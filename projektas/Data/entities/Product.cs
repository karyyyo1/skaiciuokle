using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace projektas.Data.entities
{
    /*
     * id
     * name
     * description
     * price
     * tipas (vartai, stulpai, uzpildas, automatika, automatikos priedai, varteliai,
     * ilgis
     * plotis
     * aukstis
     * atidarymo tipas
     * kiekis
     * spalva
     * uzpildo tipas
     * automatikos tipas(greitaeige, letaeige)
     */
    public enum ProductType
    {
        access_control,
        gate_engine,
        poles,
        fence,
        gate,
        gadgets
    }

    public enum GateType
    {
        push,
        two_gates
    }

    public enum FenceType
    {
        sukos,
        segmentas,
        polisadas,
        skarda
    }

    [Table("products")]
    public abstract class Product
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public abstract ProductType Type { get; }
    }

    public class AccessControl : Product
    {
        public override ProductType Type => ProductType.access_control;
    }

    public class GateEngine : Product
    {
        public GateType? GateType { get; set; }
        public bool? Fast { get; set; }
        public override ProductType Type => ProductType.gate_engine;
    }

    public class Pole : Product
    {
        public int? Width { get; set; }
        public int? Length { get; set; }
        public int? Height { get; set; }
        public override ProductType Type => ProductType.poles;
    }

    public class Gate : Product
    {
        public int? Width { get; set; }
        public int? Length { get; set; }
        public int? Height { get; set; }
        public GateType? GateType { get; set; }
        public override ProductType Type => ProductType.gate;
    }

    public class Gadget : Product
    {
        public string? Connection { get; set; }
        public int? Relays { get; set; }
        public override ProductType Type => ProductType.gadgets;
    }

    public class Fence : Product
    {
        public FenceType? FillType { get; set; }
        public override ProductType Type => ProductType.fence;
    }
}