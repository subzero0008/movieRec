using Microsoft.Extensions.Caching.Memory;

namespace MovieRecAPI.Services
{
    public class RecommendationCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly List<string> _keys;  // Външен списък за съхранение на ключовете

        public RecommendationCacheService(IMemoryCache cache)
        {
            _cache = cache;
            _keys = new List<string>();  // Инициализираме списъка
        }

        public void AddToCache(string userId, int index, object recommendation)
        {
            var key = $"recs_{userId}_{index}";
            _cache.Set(key, recommendation);
            _keys.Add(key);  // Добавяме ключа в списъка
        }

        public void InvalidateUserRecommendationsCache(string userId)
        {
            // Премахваме всички ключове, свързани с препоръките на потребителя
            var keysToRemove = _keys.Where(k => k.StartsWith($"recs_{userId}_")).ToList();

            foreach (var key in keysToRemove)
            {
                _cache.Remove(key);
                _keys.Remove(key);  // Премахваме ключа и от списъка
            }
        }
    }
}

