using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BrightTutor.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignedTeacherToRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedTeacherId",
                table: "StudentRegistrations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedTeacherName",
                table: "StudentRegistrations",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedTeacherId",
                table: "StudentRegistrations");

            migrationBuilder.DropColumn(
                name: "AssignedTeacherName",
                table: "StudentRegistrations");
        }
    }
}
