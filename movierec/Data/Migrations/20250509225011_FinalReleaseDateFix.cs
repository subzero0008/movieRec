using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace movierec.Data.Migrations
{
    public partial class FinalReleaseDateFix : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Първо коригираме данните
            migrationBuilder.Sql(@"
                UPDATE ""PollOptions""
                SET ""ReleaseDate"" = NULL 
                WHERE ""ReleaseDate""::text = '' OR ""ReleaseDate"" IS NULL;
            ");

            // 2. След това променяме типа
            migrationBuilder.AlterColumn<DateTime>(
                name: "ReleaseDate",
                table: "PollOptions",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(string),
                oldNullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ReleaseDate",
                table: "PollOptions",
                type: "text",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }
    }
}