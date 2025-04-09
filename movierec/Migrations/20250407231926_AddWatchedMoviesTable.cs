using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace movierec.Migrations
{
    /// <inheritdoc />
    public partial class AddWatchedMoviesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MovieId",
                table: "WatchedMovies",
                newName: "TmdbMovieId");

            migrationBuilder.AddColumn<string>(
                name: "MovieTitle",
                table: "WatchedMovies",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PosterPath",
                table: "WatchedMovies",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MovieTitle",
                table: "WatchedMovies");

            migrationBuilder.DropColumn(
                name: "PosterPath",
                table: "WatchedMovies");

            migrationBuilder.RenameColumn(
                name: "TmdbMovieId",
                table: "WatchedMovies",
                newName: "MovieId");
        }
    }
}
