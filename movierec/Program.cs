using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MovieRecAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// Разрешаване на CORS - правилно добавяне на политика за React приложението
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:5173") // Портът на React приложението
                        .AllowAnyMethod()  // Позволява всякакви HTTP методи
                        .AllowAnyHeader()); // Позволява всякакви заглавки
});

// Зареждане на connection string-а от конфигурацията
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<MovieRecDbContext>(options =>
    options.UseNpgsql(connectionString));

// Зареждане на API ключ и токен за TMDb API от конфигурацията
builder.Services.AddHttpClient<TMDbService>(client =>
{
    var apiKey = builder.Configuration["TMDb:ApiKey"];
    var accessToken = builder.Configuration["TMDb:AccessToken"];

    if (!string.IsNullOrEmpty(accessToken))
    {
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
    }

    if (!string.IsNullOrEmpty(apiKey))
    {
        client.DefaultRequestHeaders.Add("api_key", apiKey);
    }
});

// Регистриране на TMDbService за DI контейнера
builder.Services.AddSingleton<TMDbService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Важно: CORS middleware трябва да е **преди** UseAuthorization()
app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
