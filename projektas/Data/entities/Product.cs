namespace projektas.Data.entities
{
    public enum ProductType
    {
        access_control, //ieigos kontrole
        gate_engine, // pavaros
        poles, // stulpai
        fence, // uzpildas
        gate, // vartai
        gadgets // gsm, etc.
    }
    // Abstract base class
    public abstract class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public abstract ProductType Type { get; }
    }

    // Derived class for access_control
    public class Access_control : Product
    {
        public override ProductType Type => ProductType.access_control;
    }

    // Derived class for gates_engines
    public class Gate_engines : Product
    {
        public GateType Gatetype { get; set; }
        public bool fast { get; set; }
        public override ProductType Type => ProductType.gate_engine;
    }
    public enum GateType
    {
        push, //stumdomi
        two_gates //dviveriai
    }


    // Derived class for Electronics
    public class Poles : Product
    {
        public int width { get; set; }
        public int lenght { get; set; }
        public int height { get; set; }
        public override ProductType Type => ProductType.poles;
    }
    public class Gates : Product
    {
        public int width { get; set; }
        public int lenght { get; set; }
        public int height { get; set; }
        public GateType Gatetype { get; set; }
        public override ProductType Type => ProductType.gate;
    }
    public class Gadgets : Product
    {
        public string Connection { get; set; }
        public override ProductType Type => ProductType.gadgets;
    }
}