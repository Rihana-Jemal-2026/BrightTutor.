import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, CourseDto, ClassGroupDto } from '../../services/course.service';
import { EnrollmentService, EnrollmentDto } from '../../services/enrollment.service';
import { TeacherAssignmentService, TeacherAssignmentDto } from '../../services/teacher-assignment.service';
import { StudentService, StudentDto } from '../../services/student.service';
import { TeacherService, TeacherDto } from '../../services/teacher.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="courses-page">
      <div class="page-header">
        <div>
          <h1>📚 Course, Group & Class Management</h1>
          <p>Manage courses, online 1-on-1 classes, group sessions, home visits, student enrollments, and teacher assignments.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-create" (click)="openCourseModal()">+ Add Course</button>
          <button type="button" class="btn-create secondary" (click)="openGroupModal()">+ Add Class Group</button>
          <button type="button" class="btn-create accent" (click)="openEnrollModal()">+ Enroll Student</button>
          <button type="button" class="btn-create teacher-btn" (click)="openAssignTeacherModal()">+ Assign Teacher</button>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-bar">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'courses'" (click)="activeTab.set('courses')">
          Courses ({{ courses().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'groups'" (click)="activeTab.set('groups')">
          Class Groups ({{ classGroups().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'enrollments'" (click)="activeTab.set('enrollments')">
          Student Enrollments ({{ enrollments().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'assignments'" (click)="activeTab.set('assignments')">
          Teacher Assignments ({{ teacherAssignments().length }})
        </button>
      </div>

      <!-- 1. Courses List View -->
      @if (activeTab() === 'courses') {
        <div class="courses-grid">
          @for (course of courses(); track course.id) {
            <div class="course-card" [class.deactivated]="!course.isActive">
              <div class="course-header">
                <span class="service-pill" [class]="getServiceClass(course.serviceType)">
                  {{ getServiceName(course.serviceType) }}
                </span>
                <span class="status-pill" [class.active]="course.isActive">
                  {{ course.isActive ? 'Active' : 'Deactivated' }}
                </span>
              </div>
              <h3>{{ course.name }}</h3>
              <p>{{ course.description || 'No description provided.' }}</p>
              <div class="course-footer">
                <span>
                  @if (parseServiceTypeNumber(course.serviceType) === 2) {
                    👥 {{ course.classGroupCount }} Class Groups
                  } @else if (parseServiceTypeNumber(course.serviceType) === 3) {
                    🏠 Home-to-Home Visit Session
                  } @else {
                    💻 1-on-1 Online Session
                  }
                </span>
                <div class="card-actions">
                  <button
                    type="button"
                    class="icon-action-btn edit"
                    title="Edit Course Details"
                    (click)="openEditCourseModal(course)"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="icon-action-btn toggle"
                    [class.deactivate]="course.isActive"
                    [title]="course.isActive ? 'Deactivate Course' : 'Activate Course'"
                    (click)="toggleCourseStatus(course)"
                  >
                    {{ course.isActive ? '⏸️' : '▶️' }}
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-card">No courses registered yet. Click "+ Add Course" to create one.</div>
          }
        </div>
      }

      <!-- 2. Class Groups List View -->
      @if (activeTab() === 'groups') {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Class Group Name</th>
                <th>Associated Course</th>
                <th>Capacity Limit</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (group of classGroups(); track group.id) {
                <tr [class.deactivated-row]="!group.isActive">
                  <td class="group-name">{{ group.name }}</td>
                  <td>{{ group.courseName }}</td>
                  <td>Max {{ group.maximumStudents }} Students</td>
                  <td>
                    <span class="status-badge" [class.active]="group.isActive">
                      {{ group.isActive ? 'Active' : 'Deactivated' }}
                    </span>
                  </td>
                  <td class="text-right actions-cell">
                    <button
                      type="button"
                      class="icon-action-btn edit"
                      title="Edit Class Group"
                      (click)="openEditGroupModal(group)"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      class="icon-action-btn toggle"
                      [class.deactivate]="group.isActive"
                      [title]="group.isActive ? 'Deactivate Class Group' : 'Activate Class Group'"
                      (click)="toggleClassGroupStatus(group)"
                    >
                      {{ group.isActive ? '⏸️' : '▶️' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-state">No class groups created yet. Click "+ Add Class Group" to create one.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- 3. Student Enrollments View -->
      @if (activeTab() === 'enrollments') {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Course Name</th>
                <th>Class Group / Room</th>
                <th>Delivery Method</th>
                <th>Enrolled Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (enrollment of enrollments(); track enrollment.id) {
                <tr>
                  <td class="group-name">{{ enrollment.studentName }}</td>
                  <td>{{ enrollment.courseName }}</td>
                  <td>{{ enrollment.classGroupName || '1-on-1 Direct' }}</td>
                  <td>
                    <span class="service-pill" [class]="getServiceClass(enrollment.serviceType)">
                      {{ getServiceName(enrollment.serviceType) }}
                    </span>
                  </td>
                  <td>{{ enrollment.enrollmentDate | date:'mediumDate' }}</td>
                  <td class="text-right actions-cell">
                    <button
                      type="button"
                      class="icon-action-btn toggle deactivate"
                      title="Unenroll Student"
                      (click)="unenrollStudent(enrollment)"
                    >
                      ❌ Unenroll
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-state">No student enrollments found. Click "+ Enroll Student" above to assign a student to a class.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- 4. Teacher Assignments View -->
      @if (activeTab() === 'assignments') {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Assigned Course</th>
                <th>Assigned Class Group / Room</th>
                <th>Assigned Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (assign of teacherAssignments(); track assign.id) {
                <tr>
                  <td class="group-name">👨‍🏫 {{ assign.teacherName }}</td>
                  <td>{{ assign.courseName }}</td>
                  <td>{{ assign.classGroupName || 'All Sessions / 1-on-1' }}</td>
                  <td>{{ assign.startDate | date:'mediumDate' }}</td>
                  <td class="text-right actions-cell">
                    <button
                      type="button"
                      class="icon-action-btn toggle deactivate"
                      title="Remove Teacher Assignment"
                      (click)="removeTeacherAssignment(assign)"
                    >
                      🗑️ Remove
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-state">No teacher assignments recorded. Click "+ Assign Teacher" above to assign a teacher.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Create Course Modal -->
      @if (isCourseModalOpen()) {
        <div class="modal-overlay" (click)="closeCourseModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New Course</h3>
              <button type="button" class="close-btn" (click)="closeCourseModal()">&times;</button>
            </div>
            <form (ngSubmit)="onCreateCourse()">
              <div class="form-group">
                <label for="courseName">Course Title *</label>
                <input id="courseName" name="courseName" [(ngModel)]="newCourse.name" placeholder="e.g. Advanced Physics" required />
              </div>
              <div class="form-group">
                <label for="courseDesc">Description & Schedule Notes</label>
                <textarea id="courseDesc" name="courseDesc" [(ngModel)]="newCourse.description" placeholder="e.g. Days: Mon, Wed, Fri | Hours: 10:00 AM - 12:00 PM | Fee: 2500 ETB/mo" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label for="serviceType">Delivery Method *</label>
                <select id="serviceType" name="serviceType" [(ngModel)]="newCourse.serviceType">
                  <option [ngValue]="1">💻 Online Session (1-on-1 Personal Tutor)</option>
                  <option [ngValue]="2">👥 Group Session (Academic Center Class)</option>
                  <option [ngValue]="3">🏠 Home-to-Home Visit Tutoring</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeCourseModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Course Modal -->
      @if (isEditCourseModalOpen() && editingCourse) {
        <div class="modal-overlay" (click)="closeEditCourseModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>✏️ Edit Course Details</h3>
              <button type="button" class="close-btn" (click)="closeEditCourseModal()">&times;</button>
            </div>
            <form (ngSubmit)="onUpdateCourse()">
              <div class="form-group">
                <label for="editCourseName">Course Title *</label>
                <input id="editCourseName" name="editCourseName" [(ngModel)]="editingCourse.name" required />
              </div>
              <div class="form-group">
                <label for="editCourseDesc">Description & Schedule Notes</label>
                <textarea id="editCourseDesc" name="editCourseDesc" [(ngModel)]="editingCourse.description" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label for="editServiceType">Delivery Method *</label>
                <select id="editServiceType" name="editServiceType" [(ngModel)]="editingCourse.serviceType">
                  <option [ngValue]="1">💻 Online Session (1-on-1 Personal Tutor)</option>
                  <option [ngValue]="2">👥 Group Session (Academic Center Class)</option>
                  <option [ngValue]="3">🏠 Home-to-Home Visit Tutoring</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeEditCourseModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Create Class Group Modal -->
      @if (isGroupModalOpen()) {
        <div class="modal-overlay" (click)="closeGroupModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create Class Group & Set Schedule</h3>
              <button type="button" class="close-btn" (click)="closeGroupModal()">&times;</button>
            </div>
            <form (ngSubmit)="onCreateGroup()">
              <div class="form-group">
                <label for="assocCourse">Associated Course *</label>
                <select id="assocCourse" name="assocCourse" [(ngModel)]="newGroup.courseId" required>
                  @for (c of courses(); track c.id) {
                    <option [value]="c.id">{{ c.name }} ({{ getServiceName(c.serviceType) }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="groupName">Group Name & Schedule (Days, Time, Fee) *</label>
                <input id="groupName" name="groupName" [(ngModel)]="newGroup.name" placeholder="e.g. Group A (Mon,Wed,Fri 10:00-12:00 AM | 2500 ETB/mo)" required />
              </div>
              <div class="form-group">
                <label for="maxStudents">Max Student Capacity Limit *</label>
                <input id="maxStudents" type="number" name="maxStudents" [(ngModel)]="newGroup.maximumStudents" min="1" required />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeGroupModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">Create Class Group</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Class Group Modal -->
      @if (isEditGroupModalOpen() && editingGroup) {
        <div class="modal-overlay" (click)="closeEditGroupModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>✏️ Edit Class Group & Schedule</h3>
              <button type="button" class="close-btn" (click)="closeEditGroupModal()">&times;</button>
            </div>
            <form (ngSubmit)="onUpdateGroup()">
              <div class="form-group">
                <label for="editGroupName">Group Name & Schedule *</label>
                <input id="editGroupName" name="editGroupName" [(ngModel)]="editingGroup.name" required />
              </div>
              <div class="form-group">
                <label for="editMaxStudents">Max Student Limit *</label>
                <input id="editMaxStudents" type="number" name="editMaxStudents" [(ngModel)]="editingGroup.maximumStudents" min="1" required />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeEditGroupModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Enroll Student Modal -->
      @if (isEnrollModalOpen()) {
        <div class="modal-overlay" (click)="closeEnrollModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>🎓 Enroll Student to Course / Class</h3>
              <button type="button" class="close-btn" (click)="closeEnrollModal()">&times;</button>
            </div>
            <form (ngSubmit)="onEnrollStudent()">
              <div class="form-group">
                <label for="enrollStudentSelect">Select Student</label>
                <select id="enrollStudentSelect" name="enrollStudentSelect" [(ngModel)]="newEnrollment.studentId" required>
                  <option value="">-- Choose Student --</option>
                  @for (s of students(); track (s.id || s.studentId || s.userId)) {
                    <option [value]="s.id || s.studentId || s.userId">{{ s.firstName }} {{ s.lastName }} ({{ s.email }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="enrollCourseSelect">Select Course</label>
                <select id="enrollCourseSelect" name="enrollCourseSelect" [(ngModel)]="newEnrollment.courseId" (change)="onEnrollCourseChange()" required>
                  <option value="">-- Choose Course --</option>
                  @for (c of courses(); track c.id) {
                    <option [value]="c.id">{{ c.name }} — {{ getServiceName(c.serviceType) }}</option>
                  }
                </select>
              </div>

              @if (availableGroupsForSelectedCourse().length > 0) {
                <div class="form-group">
                  <label for="enrollGroupSelect">Class Group (Optional)</label>
                  <select id="enrollGroupSelect" name="enrollGroupSelect" [(ngModel)]="newEnrollment.classGroupId">
                    <option value="">-- No Specific Group (1-on-1 Session) --</option>
                    @for (g of availableGroupsForSelectedCourse(); track g.id) {
                      <option [value]="g.id">{{ g.name }} (Max {{ g.maximumStudents }})</option>
                    }
                  </select>
                </div>
              }

              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeEnrollModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">Confirm Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Assign Teacher Modal -->
      @if (isAssignTeacherModalOpen()) {
        <div class="modal-overlay" (click)="closeAssignTeacherModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>👨‍🏫 Assign Teacher to Course / Class Group</h3>
              <button type="button" class="close-btn" (click)="closeAssignTeacherModal()">&times;</button>
            </div>
            <form (ngSubmit)="onAssignTeacher()">
              <div class="form-group">
                <label for="assignTeacherSelect">Select Teacher</label>
                <select id="assignTeacherSelect" name="assignTeacherSelect" [(ngModel)]="newTeacherAssignment.teacherId" required>
                  <option value="">-- Choose Teacher --</option>
                  @for (t of teachers(); track (t.id || t.teacherId || t.userId)) {
                    <option [value]="t.id || t.teacherId || t.userId">{{ t.firstName }} {{ t.lastName }} ({{ t.specialization || 'Teacher' }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="assignCourseSelect">Select Course</label>
                <select id="assignCourseSelect" name="assignCourseSelect" [(ngModel)]="newTeacherAssignment.courseId" (change)="onAssignCourseChange()" required>
                  <option value="">-- Choose Course --</option>
                  @for (c of courses(); track c.id) {
                    <option [value]="c.id">{{ c.name }} — {{ getServiceName(c.serviceType) }}</option>
                  }
                </select>
              </div>

              @if (availableGroupsForTeacherCourse().length > 0) {
                <div class="form-group">
                  <label for="assignGroupSelect">Class Group (Optional)</label>
                  <select id="assignGroupSelect" name="assignGroupSelect" [(ngModel)]="newTeacherAssignment.classGroupId">
                    <option value="">-- Entire Course / 1-on-1 --</option>
                    @for (g of availableGroupsForTeacherCourse(); track g.id) {
                      <option [value]="g.id">{{ g.name }}</option>
                    }
                  </select>
                </div>
              }

              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeAssignTeacherModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">Assign Teacher</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .courses-page { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.75rem; color: var(--color-primary); margin-bottom: 0.25rem; }
    .page-header p { color: var(--color-muted); margin: 0; }
    .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-create { background: var(--color-accent); color: white; border: none; padding: 0.65rem 1.1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
    .btn-create:hover { background: var(--color-primary-light); transform: translateY(-1px); }
    .btn-create.secondary { background: #0284c7; }
    .btn-create.accent { background: #d97706; }
    .btn-create.teacher-btn { background: #7c3aed; }
    
    .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); overflow-x: auto; }
    .tab-btn { background: none; border: none; padding: 0.75rem 1.25rem; font-weight: 600; color: var(--color-muted); border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; font-size: 0.9rem; }
    .tab-btn.active { color: var(--color-accent-bright); border-bottom-color: var(--color-accent-bright); }
    
    .courses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
    .course-card { background: var(--color-surface); border-radius: 12px; padding: 1.25rem; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); transition: all 0.2s; }
    .course-card.deactivated { opacity: 0.6; background: var(--color-bg); }
    .course-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .service-pill { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .service-pill.online { background: rgba(2, 132, 199, 0.15); color: #38bdf8; }
    .service-pill.group { background: rgba(217, 119, 6, 0.15); color: #fbbf24; }
    .service-pill.home { background: var(--color-success-bg); color: var(--color-success); }
    
    .status-pill { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: var(--color-error-bg); color: var(--color-error); font-weight: 600; border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-pill.active { background: var(--color-success-bg); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.3); }
    
    .course-card h3 { font-size: 1.15rem; color: var(--color-text); margin-bottom: 0.5rem; }
    .course-card p { font-size: 0.875rem; color: var(--color-muted); margin-bottom: 1rem; }
    .course-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--color-muted); border-top: 1px solid var(--color-border); padding-top: 0.75rem; }
    .card-actions { display: flex; gap: 0.4rem; }
    
    .table-card { background: var(--color-surface); border-radius: 12px; padding: 1rem; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
    .data-table th { background: var(--color-bg); font-weight: 600; color: var(--color-muted); font-size: 0.85rem; text-transform: uppercase; }
    .group-name { font-weight: 600; color: var(--color-text); }
    .status-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: var(--color-error-bg); color: var(--color-error); font-weight: 600; border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-badge.active { background: var(--color-success-bg); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.3); }
    .text-right { text-align: right; }
    .actions-cell { display: flex; justify-content: flex-end; gap: 0.4rem; align-items: center; }
    
    .icon-action-btn { border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.4rem 0.65rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
    .icon-action-btn:hover { background: var(--color-surface); transform: scale(1.03); }
    .icon-action-btn.edit { border-color: var(--color-accent-bright); background: rgba(16, 185, 129, 0.1); }
    .icon-action-btn.toggle { border-color: var(--color-border); }
    .icon-action-btn.toggle.deactivate { border-color: rgba(239, 68, 68, 0.4); background: var(--color-error-bg); color: var(--color-error); }
    
    .empty-card, .empty-state { background: var(--color-surface); padding: 2.5rem; border-radius: 12px; text-align: center; color: var(--color-muted); width: 100%; border: 1px solid var(--color-border); }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); }
    .modal-card { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 14px; width: 100%; max-width: 500px; padding: 1.75rem; box-shadow: var(--shadow-card-hover); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-header h3 { margin: 0; font-size: 1.2rem; color: var(--color-text); }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--color-muted); cursor: pointer; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.35rem; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); font-size: 0.9rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-cancel { background: var(--color-bg); color: var(--color-muted); border: 1px solid var(--color-border); padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-save { background: var(--color-accent); color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: var(--color-primary-light); }
  `]
})
export class CoursesComponent implements OnInit {
  courses = signal<CourseDto[]>([]);
  classGroups = signal<ClassGroupDto[]>([]);
  enrollments = signal<EnrollmentDto[]>([]);
  teacherAssignments = signal<TeacherAssignmentDto[]>([]);
  students = signal<StudentDto[]>([]);
  teachers = signal<TeacherDto[]>([]);

  activeTab = signal<'courses' | 'groups' | 'enrollments' | 'assignments'>('courses');

  isCourseModalOpen = signal<boolean>(false);
  isEditCourseModalOpen = signal<boolean>(false);
  isGroupModalOpen = signal<boolean>(false);
  isEditGroupModalOpen = signal<boolean>(false);
  isEnrollModalOpen = signal<boolean>(false);
  isAssignTeacherModalOpen = signal<boolean>(false);

  submitting = signal<boolean>(false);

  newCourse = { name: '', description: '', serviceType: 1 };
  editingCourse: any = null;

  newGroup = { courseId: '', name: '', maximumStudents: 25 };
  editingGroup: any = null;

  newEnrollment = { studentId: '', courseId: '', classGroupId: '' };
  newTeacherAssignment = { teacherId: '', courseId: '', classGroupId: '' };

  availableGroupsForSelectedCourse = signal<ClassGroupDto[]>([]);
  availableGroupsForTeacherCourse = signal<ClassGroupDto[]>([]);

  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private teacherAssignmentService = inject(TeacherAssignmentService);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses.set(res);
        if (res.length > 0) this.newGroup.courseId = res[0].id;
      }
    });

    this.courseService.getClassGroups().subscribe({
      next: (res) => this.classGroups.set(res)
    });

    this.enrollmentService.getAllEnrollments().subscribe({
      next: (res) => this.enrollments.set(res)
    });

    this.teacherAssignmentService.getTeacherAssignments().subscribe({
      next: (res) => this.teacherAssignments.set(res)
    });

    this.studentService.getStudents().subscribe({
      next: (res) => this.students.set(res)
    });

    this.teacherService.getTeachers().subscribe({
      next: (res) => this.teachers.set(res)
    });
  }

  openCourseModal(): void {
    this.newCourse = { name: '', description: '', serviceType: 1 };
    this.isCourseModalOpen.set(true);
  }

  closeCourseModal(): void {
    this.isCourseModalOpen.set(false);
  }

  parseServiceTypeNumber(val: any): number {
    if (val === null || val === undefined) return 1;
    const s = String(val).toLowerCase().trim();
    if (s === '1' || s === 'online') return 1;
    if (s === '2' || s === 'group') return 2;
    if (s === '3' || s === 'hometohome' || s === 'home' || s === 'homevisit') return 3;
    const num = Number(val);
    return isNaN(num) ? 1 : num;
  }

  openEditCourseModal(course: CourseDto): void {
    this.editingCourse = {
      id: course.id,
      name: course.name,
      description: course.description || '',
      serviceType: this.parseServiceTypeNumber(course.serviceType)
    };
    this.isEditCourseModalOpen.set(true);
  }

  closeEditCourseModal(): void {
    this.editingCourse = null;
    this.isEditCourseModalOpen.set(false);
  }

  openGroupModal(): void {
    this.newGroup = { courseId: this.courses().length > 0 ? this.courses()[0].id : '', name: '', maximumStudents: 25 };
    this.isGroupModalOpen.set(true);
  }

  closeGroupModal(): void {
    this.isGroupModalOpen.set(false);
  }

  openEditGroupModal(group: ClassGroupDto): void {
    this.editingGroup = {
      id: group.id,
      name: group.name,
      maximumStudents: group.maximumStudents
    };
    this.isEditGroupModalOpen.set(true);
  }

  closeEditGroupModal(): void {
    this.editingGroup = null;
    this.isEditGroupModalOpen.set(false);
  }

  openEnrollModal(): void {
    this.newEnrollment = { studentId: '', courseId: '', classGroupId: '' };
    this.availableGroupsForSelectedCourse.set([]);
    this.isEnrollModalOpen.set(true);
  }

  closeEnrollModal(): void {
    this.isEnrollModalOpen.set(false);
  }

  onEnrollCourseChange(): void {
    if (!this.newEnrollment.courseId) {
      this.availableGroupsForSelectedCourse.set([]);
      return;
    }
    const filtered = this.classGroups().filter(g => g.courseId === this.newEnrollment.courseId);
    this.availableGroupsForSelectedCourse.set(filtered);
    this.newEnrollment.classGroupId = '';
  }

  openAssignTeacherModal(): void {
    this.newTeacherAssignment = { teacherId: '', courseId: '', classGroupId: '' };
    this.availableGroupsForTeacherCourse.set([]);
    this.isAssignTeacherModalOpen.set(true);
  }

  closeAssignTeacherModal(): void {
    this.isAssignTeacherModalOpen.set(false);
  }

  onAssignCourseChange(): void {
    if (!this.newTeacherAssignment.courseId) {
      this.availableGroupsForTeacherCourse.set([]);
      return;
    }
    const filtered = this.classGroups().filter(g => g.courseId === this.newTeacherAssignment.courseId);
    this.availableGroupsForTeacherCourse.set(filtered);
    this.newTeacherAssignment.classGroupId = '';
  }

  onCreateCourse(): void {
    if (!this.newCourse.name) {
      this.toast.showError('Course title is required.');
      return;
    }
    this.submitting.set(true);
    this.courseService.createCourse({
      name: this.newCourse.name,
      description: this.newCourse.description,
      serviceType: this.parseServiceTypeNumber(this.newCourse.serviceType)
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeCourseModal();
        this.toast.showSuccess('Course created successfully!');
        this.loadData();
      },
      error: () => this.submitting.set(false)
    });
  }

  onUpdateCourse(): void {
    if (!this.editingCourse.name) {
      this.toast.showError('Course title is required.');
      return;
    }
    this.submitting.set(true);
    this.courseService.updateCourse(this.editingCourse.id, {
      name: this.editingCourse.name,
      description: this.editingCourse.description,
      serviceType: this.parseServiceTypeNumber(this.editingCourse.serviceType)
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeEditCourseModal();
        this.toast.showSuccess('Course updated successfully!');
        this.loadData();
      },
      error: () => this.submitting.set(false)
    });
  }

  onCreateGroup(): void {
    if (!this.newGroup.name || !this.newGroup.courseId) {
      this.toast.showError('Please select a course and enter group name.');
      return;
    }
    this.submitting.set(true);
    this.courseService.createClassGroup(this.newGroup).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeGroupModal();
        this.toast.showSuccess('Class group created successfully!');
        this.loadData();
      },
      error: () => this.submitting.set(false)
    });
  }

  onUpdateGroup(): void {
    if (!this.editingGroup.name) {
      this.toast.showError('Group name is required.');
      return;
    }
    this.submitting.set(true);
    this.courseService.updateClassGroup(this.editingGroup.id, {
      name: this.editingGroup.name,
      maximumStudents: Number(this.editingGroup.maximumStudents)
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeEditGroupModal();
        this.toast.showSuccess('Class group updated successfully!');
        this.loadData();
      },
      error: () => this.submitting.set(false)
    });
  }

  onEnrollStudent(): void {
    if (!this.newEnrollment.studentId || !this.newEnrollment.courseId) {
      this.toast.showError('Student and Course selections are required.');
      return;
    }
    this.submitting.set(true);
    this.enrollmentService.enrollStudent({
      studentId: this.newEnrollment.studentId,
      courseId: this.newEnrollment.courseId,
      classGroupId: this.newEnrollment.classGroupId || undefined
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeEnrollModal();
        this.toast.showSuccess('Student enrolled successfully!');
        this.loadData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.showError(err?.error?.message || 'Failed to enroll student.');
      }
    });
  }

  unenrollStudent(enrollment: EnrollmentDto): void {
    this.enrollmentService.unenrollStudent(enrollment.id).subscribe({
      next: () => {
        this.toast.showSuccess(`Unenrolled student from ${enrollment.courseName}.`);
        this.loadData();
      },
      error: () => this.toast.showError('Failed to unenroll student.')
    });
  }

  onAssignTeacher(): void {
    if (!this.newTeacherAssignment.teacherId || !this.newTeacherAssignment.courseId) {
      this.toast.showError('Teacher and Course selections are required.');
      return;
    }
    this.submitting.set(true);
    this.teacherAssignmentService.assignTeacher({
      teacherId: this.newTeacherAssignment.teacherId,
      courseId: this.newTeacherAssignment.courseId,
      classGroupId: this.newTeacherAssignment.classGroupId || undefined
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeAssignTeacherModal();
        this.toast.showSuccess('Teacher assigned successfully!');
        this.loadData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.showError(err?.error?.message || 'Failed to assign teacher.');
      }
    });
  }

  removeTeacherAssignment(assignment: TeacherAssignmentDto): void {
    this.teacherAssignmentService.removeTeacherAssignment(assignment.id).subscribe({
      next: () => {
        this.toast.showSuccess(`Removed teacher assignment from ${assignment.courseName}.`);
        this.loadData();
      },
      error: () => this.toast.showError('Failed to remove teacher assignment.')
    });
  }

  toggleCourseStatus(course: CourseDto): void {
    const newStatus = !course.isActive;
    const actionText = newStatus ? 'activated' : 'deactivated';

    this.courseService.toggleCourseStatus(course.id, newStatus).subscribe({
      next: () => {
        this.toast.showSuccess(`Course '${course.name}' has been ${actionText}.`);
        this.loadData();
      },
      error: () => {
        this.toast.showError(`Failed to update status for course '${course.name}'.`);
      }
    });
  }

  toggleClassGroupStatus(group: ClassGroupDto): void {
    const newStatus = !group.isActive;
    const actionText = newStatus ? 'activated' : 'deactivated';

    this.courseService.toggleClassGroupStatus(group.id, newStatus).subscribe({
      next: () => {
        this.toast.showSuccess(`Class group '${group.name}' has been ${actionText}.`);
        this.loadData();
      },
      error: () => {
        this.toast.showError(`Failed to update status for class group '${group.name}'.`);
      }
    });
  }

  getServiceName(type: any): string {
    const num = this.parseServiceTypeNumber(type);
    switch (num) {
      case 1: return 'Online (1-on-1)';
      case 2: return 'Group Session';
      case 3: return 'Home-to-Home Visit';
      default: return 'General';
    }
  }

  getServiceClass(type: any): string {
    const num = this.parseServiceTypeNumber(type);
    switch (num) {
      case 1: return 'online';
      case 2: return 'group';
      case 3: return 'home';
      default: return '';
    }
  }
}
