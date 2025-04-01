using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MovieRecAPI.Data;
using movierec.Models;
using TMDb.Models;

var builder = WebApplication.CreateBuilder(args);

// Разрешаване на CORS - правилно добавяне на политика за React приложението
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:5173")
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

// Зареждане на connection string-а от конфигурацията
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<MovieRecDbContext>(options =>
    options.UseNpgsql(connectionString));

// Регистриране на ASP.NET Identity
builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<MovieRecDbContext>()
    .AddDefaultTokenProviders();

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

// Създаване на роли при първото стартиране
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

    string[] roles = { "Admin", "Normal User", "Cinema/Streaming Provider", "Guest" };

    foreach (var role in roles)
    {
        var roleExist = await roleManager.RoleExistsAsync(role);
        if (!roleExist)
        {
            var result = await roleManager.CreateAsync(new IdentityRole(role));
            if (!result.Succeeded)
            {
                // Логване на грешки ако има проблем със създаването на ролята
                Console.WriteLine($"Error creating role {role}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }
    }
}

// Важно: CORS middleware трябва да е **преди** UseAuthorization()
app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Добавяне на Authentication и Authorization Middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
