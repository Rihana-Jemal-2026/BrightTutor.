using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BrightTutor.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceIntegrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"Attendances\" WHERE \"ClassGroupId\" NOT IN (SELECT \"Id\" FROM \"ClassGroups\");");
            migrationBuilder.Sql("DELETE FROM \"Attendances\" WHERE \"StudentId\" NOT IN (SELECT \"Id\" FROM \"Students\");");
            migrationBuilder.Sql("DELETE FROM \"Attendances\" WHERE \"TeacherId\" NOT IN (SELECT \"Id\" FROM \"Teachers\");");
            migrationBuilder.Sql("DELETE FROM \"TeacherAttendances\" WHERE \"TeacherId\" NOT IN (SELECT \"Id\" FROM \"Teachers\");");

            migrationBuilder.AddColumn<Guid>(
                name: "ScheduleId",
                table: "Attendances",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAttendances_AttendanceDate",
                table: "TeacherAttendances",
                column: "AttendanceDate");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherAttendances_TeacherId",
                table: "TeacherAttendances",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_AttendanceDate",
                table: "Attendances",
                column: "AttendanceDate");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_ClassGroupId",
                table: "Attendances",
                column: "ClassGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_ScheduleId",
                table: "Attendances",
                column: "ScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_StudentId",
                table: "Attendances",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_TeacherId",
                table: "Attendances",
                column: "TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_ClassGroups_ClassGroupId",
                table: "Attendances",
                column: "ClassGroupId",
                principalTable: "ClassGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_Schedules_ScheduleId",
                table: "Attendances",
                column: "ScheduleId",
                principalTable: "Schedules",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_Students_StudentId",
                table: "Attendances",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_Teachers_TeacherId",
                table: "Attendances",
                column: "TeacherId",
                principalTable: "Teachers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TeacherAttendances_Teachers_TeacherId",
                table: "TeacherAttendances",
                column: "TeacherId",
                principalTable: "Teachers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_ClassGroups_ClassGroupId",
                table: "Attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_Schedules_ScheduleId",
                table: "Attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_Students_StudentId",
                table: "Attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_Teachers_TeacherId",
                table: "Attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_TeacherAttendances_Teachers_TeacherId",
                table: "TeacherAttendances");

            migrationBuilder.DropIndex(
                name: "IX_TeacherAttendances_AttendanceDate",
                table: "TeacherAttendances");

            migrationBuilder.DropIndex(
                name: "IX_TeacherAttendances_TeacherId",
                table: "TeacherAttendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_AttendanceDate",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_ClassGroupId",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_ScheduleId",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_StudentId",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_TeacherId",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "ScheduleId",
                table: "Attendances");
        }
    }
}
