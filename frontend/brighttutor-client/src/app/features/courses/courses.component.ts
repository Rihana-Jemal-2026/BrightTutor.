import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, CourseDto, ClassGroupDto } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="courses-page">
      <div class="page-header">
        <div>
          <h1>📚 Course & Class Group Management</h1>
          <p>Manage curriculum courses, online sessions, and group classes.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-create" (click)="openCourseModal()">+ Add Course</button>
          <button type="button" class="btn-create secondary" (click)="openGroupModal()">+ Add Class Group</button>
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
      </div>

      <!-- Courses List View -->
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
                <span>👥 {{ course.classGroupCount }} Class Groups</span>
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

      <!-- Class Groups List View -->
      @if (activeTab() === 'groups') {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Class Group Name</th>
                <th>Associated Course</th>
                <th>Enrolled Students</th>
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
                  <td>{{ group.enrolledStudentsCount }} Students</td>
                  <td>Max {{ group.maximumStudents }}</td>
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
                <tr><td colspan="6" class="empty-state">No class groups created yet. Click "+ Add Class Group" to create one.</td></tr>
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
                <label for="courseName">Course Title</label>
                <input id="courseName" name="courseName" [(ngModel)]="newCourse.name" placeholder="e.g. Advanced Physics" required />
              </div>
              <div class="form-group">
                <label for="courseDesc">Description</label>
                <textarea id="courseDesc" name="courseDesc" [(ngModel)]="newCourse.description" placeholder="Course outline..." rows="3"></textarea>
              </div>
              <div class="form-group">
                <label for="serviceType">Delivery Method</label>
                <select id="serviceType" name="serviceType" [(ngModel)]="newCourse.serviceType">
                  <option [ngValue]="1">Online Session (1-on-1)</option>
                  <option [ngValue]="2">Group Session</option>
                  <option [ngValue]="3">Home Visit Tutoring</option>
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
                <label for="editCourseName">Course Title</label>
                <input id="editCourseName" name="editCourseName" [(ngModel)]="editingCourse.name" required />
              </div>
              <div class="form-group">
                <label for="editCourseDesc">Description</label>
                <textarea id="editCourseDesc" name="editCourseDesc" [(ngModel)]="editingCourse.description" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label for="editServiceType">Delivery Method</label>
                <select id="editServiceType" name="editServiceType" [(ngModel)]="editingCourse.serviceType">
                  <option [ngValue]="1">Online Session (1-on-1)</option>
                  <option [ngValue]="2">Group Session</option>
                  <option [ngValue]="3">Home Visit Tutoring</option>
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
              <h3>Create Class Group</h3>
              <button type="button" class="close-btn" (click)="closeGroupModal()">&times;</button>
            </div>
            <form (ngSubmit)="onCreateGroup()">
              <div class="form-group">
                <label for="assocCourse">Associated Course</label>
                <select id="assocCourse" name="assocCourse" [(ngModel)]="newGroup.courseId" required>
                  @for (c of courses(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="groupName">Group Name</label>
                <input id="groupName" name="groupName" [(ngModel)]="newGroup.name" placeholder="e.g. Group A - Morning" required />
              </div>
              <div class="form-group">
                <label for="maxStudents">Max Student Limit</label>
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
              <h3>✏️ Edit Class Group</h3>
              <button type="button" class="close-btn" (click)="closeEditGroupModal()">&times;</button>
            </div>
            <form (ngSubmit)="onUpdateGroup()">
              <div class="form-group">
                <label for="editGroupName">Group Name</label>
                <input id="editGroupName" name="editGroupName" [(ngModel)]="editingGroup.name" required />
              </div>
              <div class="form-group">
                <label for="editMaxStudents">Max Student Limit</label>
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
    </div>
  `,
  styles: [`
    .courses-page { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; color: #1e293b; margin-bottom: 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }
    .header-actions { display: flex; gap: 0.75rem; }
    .btn-create { background: #2563eb; color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-create.secondary { background: #059669; }
    .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .tab-btn { background: none; border: none; padding: 0.75rem 1.25rem; font-weight: 600; color: #64748b; border-bottom: 2px solid transparent; cursor: pointer; }
    .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }
    .courses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
    .course-card { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: opacity 0.2s; }
    .course-card.deactivated { opacity: 0.7; background: #f8fafc; }
    .course-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .service-pill { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .service-pill.online { background: #e0f2fe; color: #0284c7; }
    .service-pill.group { background: #fef3c7; color: #d97706; }
    .service-pill.home { background: #dcfce7; color: #15803d; }
    .status-pill { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: #fee2e2; color: #dc2626; font-weight: 600; }
    .status-pill.active { background: #d1fae5; color: #059669; }
    .course-card h3 { font-size: 1.15rem; color: #0f172a; margin-bottom: 0.5rem; }
    .course-card p { font-size: 0.875rem; color: #64748b; margin-bottom: 1rem; }
    .course-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }
    .card-actions { display: flex; gap: 0.4rem; }
    .table-card { background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.85rem; text-transform: uppercase; }
    .group-name { font-weight: 600; color: #0f172a; }
    .status-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: #fee2e2; color: #dc2626; font-weight: 600; }
    .status-badge.active { background: #d1fae5; color: #059669; }
    .text-right { text-align: right; }
    .actions-cell { display: flex; justify-content: flex-end; gap: 0.4rem; align-items: center; }
    .icon-action-btn { border: 1px solid #cbd5e1; background: #f8fafc; padding: 0.4rem 0.65rem; border-radius: 8px; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
    .icon-action-btn:hover { background: #e2e8f0; transform: scale(1.05); }
    .icon-action-btn.edit { border-color: #bfdbfe; background: #eff6ff; }
    .icon-action-btn.toggle.deactivate { border-color: #fca5a5; background: #fef2f2; }
    .empty-card, .empty-state { background: white; padding: 2.5rem; border-radius: 12px; text-align: center; color: #94a3b8; width: 100%; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .modal-card { background: white; border-radius: 14px; width: 100%; max-width: 480px; padding: 1.75rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-cancel { background: #e2e8f0; color: #475569; border: none; padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-save { background: #2563eb; color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
  `]
})
export class CoursesComponent implements OnInit {
  courses = signal<CourseDto[]>([]);
  classGroups = signal<ClassGroupDto[]>([]);
  activeTab = signal<'courses' | 'groups'>('courses');

  isCourseModalOpen = signal<boolean>(false);
  isEditCourseModalOpen = signal<boolean>(false);
  isGroupModalOpen = signal<boolean>(false);
  isEditGroupModalOpen = signal<boolean>(false);
  submitting = signal<boolean>(false);

  newCourse = { name: '', description: '', serviceType: 1 };
  editingCourse: any = null;

  newGroup = { courseId: '', name: '', maximumStudents: 25 };
  editingGroup: any = null;

  private courseService = inject(CourseService);
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
  }

  openCourseModal(): void {
    this.newCourse = { name: '', description: '', serviceType: 1 };
    this.isCourseModalOpen.set(true);
  }

  closeCourseModal(): void {
    this.isCourseModalOpen.set(false);
  }

  openEditCourseModal(course: CourseDto): void {
    this.editingCourse = {
      id: course.id,
      name: course.name,
      description: course.description || '',
      serviceType: Number(course.serviceType)
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

  onCreateCourse(): void {
    if (!this.newCourse.name) {
      this.toast.showError('Course title is required.');
      return;
    }
    this.submitting.set(true);
    this.courseService.createCourse(this.newCourse).subscribe({
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
      serviceType: Number(this.editingCourse.serviceType)
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

  getServiceName(type: number): string {
    switch (type) {
      case 1: return 'Online';
      case 2: return 'Group';
      case 3: return 'Home Visit';
      default: return 'General';
    }
  }

  getServiceClass(type: number): string {
    switch (type) {
      case 1: return 'online';
      case 2: return 'group';
      case 3: return 'home';
      default: return '';
    }
  }
}
