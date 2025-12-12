using System.Security.Cryptography;

namespace projektas.Services
{
    public class PasswordHasher : IPasswordHasher
    {
        private const int SaltSize = 16; // 128 bits
        private const int KeySize = 32; // 256 bits
        private const int Iterations = 100000;
        private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

        public string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

            return $"{Convert.ToHexString(hash)}-{Convert.ToHexString(salt)}";
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            var parts = hashedPassword.Split('-');
            if (parts.Length != 2)
            {
                return false;
            }

            var hash = Convert.FromHexString(parts[0]);
            var salt = Convert.FromHexString(parts[1]);

            var hashToCompare = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

            return CryptographicOperations.FixedTimeEquals(hash, hashToCompare);
        }
    }
}
