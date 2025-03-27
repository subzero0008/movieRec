using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MovieRecAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// ����������� �� CORS - �������� �������� �� �������� �� React ������������
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:5173") // ������ �� React ������������
                        .AllowAnyMethod()  // ��������� �������� HTTP ������
                        .AllowAnyHeader()); // ��������� �������� ��������
});

// ��������� �� connection string-� �� ��������������
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<MovieRecDbContext>(options =>
    options.UseNpgsql(connectionString));

// ��������� �� API ���� � ����� �� TMDb API �� ��������������
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

// ������������ �� TMDbService �� DI ����������
builder.Services.AddSingleton<TMDbService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// �����: CORS middleware ������ �� � **�����** UseAuthorization()
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
