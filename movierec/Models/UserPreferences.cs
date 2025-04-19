using System.Collections.Generic;
using System.Linq;

namespace movierec.Models
{
    public class UserPreferences
    {
        // Речници за съхранение на тежести
        public Dictionary<string, int> GenreWeights { get; } = new Dictionary<string, int>();
        public Dictionary<string, int> ActorWeights { get; } = new Dictionary<string, int>();
        public Dictionary<string, int> DirectorWeights { get; } = new Dictionary<string, int>();
        public Dictionary<string, int> KeywordWeights { get; } = new Dictionary<string, int>();

        // Списък с ID-та на високо оценени филми
        public List<int> TopRatedMovieIds { get; } = new List<int>();

        // Добавяне на жанр с тежест
        public void AddGenre(string genre, int weight = 1)
        {
            if (string.IsNullOrWhiteSpace(genre)) return;
            GenreWeights[genre] = GenreWeights.TryGetValue(genre, out var current) ? current + weight : weight;
        }

        // Добавяне на актьор с тежест
        public void AddActor(string actor, int weight = 1)
        {
            if (string.IsNullOrWhiteSpace(actor)) return;
            ActorWeights[actor] = ActorWeights.TryGetValue(actor, out var current) ? current + weight : weight;
        }

        // Добавяне на режисьор с тежест
        public void AddDirector(string director, int weight = 1)
        {
            if (string.IsNullOrWhiteSpace(director)) return;
            DirectorWeights[director] = DirectorWeights.TryGetValue(director, out var current) ? current + weight : weight;
        }

        // Добавяне на ключова дума с тежест
        public void AddKeyword(string keyword, int weight = 1)
        {
            if (string.IsNullOrWhiteSpace(keyword)) return;
            KeywordWeights[keyword] = KeywordWeights.TryGetValue(keyword, out var current) ? current + weight : weight;
        }

        // Добавяне на филм към топ листа
        public void AddMovieId(int movieId)
        {
            if (!TopRatedMovieIds.Contains(movieId))
                TopRatedMovieIds.Add(movieId);
        }

        // Топ жанрове (по тежест)
        public List<string> TopGenres => GetTopItems(GenreWeights, 3);

        // Топ актьори (по тежест)
        public List<string> TopActors => GetTopItems(ActorWeights, 3);

        // Топ режисьори (по тежест)
        public List<string> TopDirectors => GetTopItems(DirectorWeights, 2);

        // Топ ключови думи (по тежест)
        public List<string> TopKeywords => GetTopItems(KeywordWeights, 5);

        private List<string> GetTopItems(Dictionary<string, int> source, int count)
        {
            return source
                .OrderByDescending(x => x.Value)
                .Take(count)
                .Select(x => x.Key)
                .ToList();
        }

        // Метод за преглед на всички предпочитания
        public override string ToString()
        {
            return $"Genres: {string.Join(", ", TopGenres)}\n" +
                   $"Actors: {string.Join(", ", TopActors)}\n" +
                   $"Directors: {string.Join(", ", TopDirectors)}\n" +
                   $"Keywords: {string.Join(", ", TopKeywords)}\n" +
                   $"Top Movies: {string.Join(", ", TopRatedMovieIds.Take(3))}";
        }

        // Метод за нормализиране на тежестите между 0-100
        public void NormalizeWeights()
        {
            NormalizeDictionary(GenreWeights);
            NormalizeDictionary(ActorWeights);
            NormalizeDictionary(DirectorWeights);
            NormalizeDictionary(KeywordWeights);
        }

        private void NormalizeDictionary(Dictionary<string, int> dictionary)
        {
            if (dictionary.Count == 0) return;

            var maxValue = dictionary.Values.Max();
            if (maxValue == 0) return;

            foreach (var key in dictionary.Keys.ToList())
            {
                dictionary[key] = (int)((float)dictionary[key] / maxValue * 100);
            }
        }

        // Метод за получаване на всички значими предпочитания
        public Dictionary<string, int> GetAllPreferences()
        {
            var all = new Dictionary<string, int>();

            foreach (var genre in GenreWeights)
                all[$"Genre:{genre.Key}"] = genre.Value;

            foreach (var actor in ActorWeights)
                all[$"Actor:{actor.Key}"] = actor.Value;

            foreach (var director in DirectorWeights)
                all[$"Director:{director.Key}"] = director.Value;

            foreach (var keyword in KeywordWeights)
                all[$"Keyword:{keyword.Key}"] = keyword.Value;

            return all;
        }
    }
}