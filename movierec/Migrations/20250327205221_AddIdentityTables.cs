using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace movierec.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Year",
                table: "Movies");

            migrationBuilder.RenameColumn(
                name: "Genre",
                table: "Movies",
                newName: "ReleaseDate");

            migrationBuilder.AddColumn<string>(
                name: "PosterPath",
                table: "Movies",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PosterUrl",
                table: "Movies",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "Movies",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PosterPath",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "PosterUrl",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "Movies");

            migrationBuilder.RenameColumn(
                name: "ReleaseDate",
                table: "Movies",
                newName: "Genre");

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Movies",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
