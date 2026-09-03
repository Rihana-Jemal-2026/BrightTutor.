$loginUrl = "http://localhost:5198/api/auth/login"
$loginBody = @{
    email = "admin@brighttutor.com"
    password = "AdminPass123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "========================================================"
Write-Host "1. TEACHERS IN DATABASE"
Write-Host "========================================================"
$teachers = Invoke-RestMethod -Uri "http://localhost:5198/api/teachers" -Headers $headers
$teachers | Format-Table -Property id, teacherCode, firstName, lastName, email, specialization -AutoSize | Out-String | Write-Host

Write-Host "========================================================"
Write-Host "2. COURSES IN DATABASE"
Write-Host "========================================================"
$courses = Invoke-RestMethod -Uri "http://localhost:5198/api/courses" -Headers $headers
$courses | Format-Table -Property id, code, name, gradeLevel, credits -AutoSize | Out-String | Write-Host

Write-Host "========================================================"
Write-Host "3. TEACHER COURSE ASSIGNMENTS (Teacher -> Course)"
Write-Host "========================================================"
try {
    $assignments = Invoke-RestMethod -Uri "http://localhost:5198/api/teacherassignments" -Headers $headers
    $assignments | Format-Table -Property id, teacherId, teacherCode, teacherName, courseId, courseName, classGroupName -AutoSize | Out-String | Write-Host
} catch {
    Write-Host "No teacher assignments or error querying assignments"
}

Write-Host "========================================================"
Write-Host "4. STUDENTS IN DATABASE"
Write-Host "========================================================"
$students = Invoke-RestMethod -Uri "http://localhost:5198/api/students" -Headers $headers
$students | Format-Table -Property id, studentCode, firstName, lastName, gradeLevel, email -AutoSize | Out-String | Write-Host

Write-Host "========================================================"
Write-Host "5. STUDENT ENROLLMENTS (Student -> Course)"
Write-Host "========================================================"
$enrollments = Invoke-RestMethod -Uri "http://localhost:5198/api/enrollments" -Headers $headers
$enrollments | Format-Table -Property id, studentId, studentCode, studentName, courseId, courseName, classGroupName, isActive -AutoSize | Out-String | Write-Host

Write-Host "========================================================"
Write-Host "6. FULL MAPPING: STUDENT -> ENROLLED COURSE -> ASSIGNED TEACHER"
Write-Host "========================================================"

foreach ($s in $students) {
    Write-Host ""
    Write-Host "Student: $($s.firstName) $($s.lastName) | Code: $($s.studentCode) | ID: $($s.id)"
    $sEnrollments = $enrollments | Where-Object { $_.studentId -eq $s.id -and $_.isActive -eq $true }
    
    if (-not $sEnrollments) {
        Write-Host "   └── [No Active Enrolled Courses]"
    } else {
        foreach ($se in $sEnrollments) {
            $matchedAssignments = $assignments | Where-Object { $_.courseId -eq $se.courseId }
            if ($matchedAssignments) {
                foreach ($ma in $matchedAssignments) {
                    Write-Host "   ├── Course: $($se.courseName) (ID: $($se.courseId))"
                    Write-Host "   │   └── Assigned Teacher: $($ma.teacherName) (Code: $($ma.teacherCode) | ID: $($ma.teacherId))"
                }
            } else {
                Write-Host "   ├── Course: $($se.courseName) (ID: $($se.courseId))"
                Write-Host "   │   └── Assigned Teacher: [No specific teacher assigned to this course]"
            }
        }
    }
}
Write-Host ""
Write-Host "========================================================"
