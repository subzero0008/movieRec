namespace TMDb.Models
{
    public class MovieDetails : Movie
    {
        public int Runtime { get; set; }
        public string Tagline { get; set; }
        public List<ProductionCompany> ProductionCompanies { get; set; }
    }

    public class ProductionCompany
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string LogoPath { get; set; }
        public string OriginCountry { get; set; }
    }
}
