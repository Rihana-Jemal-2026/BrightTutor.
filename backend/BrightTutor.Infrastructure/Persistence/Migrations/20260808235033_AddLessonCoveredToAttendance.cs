using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BrightTutor.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonCoveredToAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LessonCovered",
                table: "Attendances",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LessonCovered",
                table: "Attendances");
        }
    }
}
