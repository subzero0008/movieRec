using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace movierec.Migrations
{
    /// <inheritdoc />
    public partial class FixReleaseDateColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"ALTER TABLE ""PollOptions"" ALTER COLUMN ""ReleaseDate"" DROP DEFAULT;
                  ALTER TABLE ""PollOptions"" ALTER COLUMN ""ReleaseDate"" TYPE timestamp with time zone USING ""ReleaseDate""::timestamp with time zone;"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"ALTER TABLE ""PollOptions"" ALTER COLUMN ""ReleaseDate"" TYPE timestamp WITHOUT time zone;"
            );
        }
    }
}
