using Microsoft.EntityFrameworkCore;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<BrightTutor.Infrastructure.Persistence.ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<BrightTutor.Application.Abstractions.Persistence.IApplicationDbContext>(
    provider => provider.GetRequiredService<BrightTutor.Infrastructure.Persistence.ApplicationDbContext>());

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddValidatorsFromAssembly(typeof(BrightTutor.Application.Attendance.Commands.MarkGroupAttendance.MarkGroupAttendanceCommand).Assembly);
builder.Services.AddTransient(typeof(MediatR.IPipelineBehavior<,>), typeof(BrightTutor.Application.Common.Behaviors.ValidationBehavior<,>));
builder.Services.AddAutoMapper(cfg =>
    cfg.AddProfile<BrightTutor.Application.Common.Mappings.AttendanceMappingProfile>());
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(BrightTutor.Application.Attendance.Commands.MarkGroupAttendance.MarkGroupAttendanceCommand).Assembly));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();