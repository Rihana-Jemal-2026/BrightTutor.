import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherAssignmentService } from '../../services/teacher-assignment.service';
import { CourseService, CourseDto, ClassGroupDto } from '../../services/course.service';
import { UserService, UserDto } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { TeacherAssignmentDto, AssignTeacherRequest } from '../../models/teacher-assignment.model';
import { SearchableSelectComponent, SelectOption } from '../../components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './teacher-assignments.component.html',
  styleUrl: './teacher-assignments.component.scss'
})
export class TeacherAssignmentsComponent implements OnInit {
  private assignmentService = inject(TeacherAssignmentService);
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  assignments = signal<TeacherAssignmentDto[]>([]);
  courses = signal<CourseDto[]>([]);
  classGroups = signal<ClassGroupDto[]>([]);
  teachers = signal<UserDto[]>([]);
  loading = signal<boolean>(true);

  // Filter signals
  filterCourseOptions = signal<SelectOption[]>([]);
  filterTeacherOptions = signal<SelectOption[]>([]);
  selectedFilterCourseId = signal<string>('');
  selectedFilterTeacherId = signal<string>('');

  // Modal State
  isAssignModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingAssignmentId = signal<string | null>(null);

  modalTeacherOptions = signal<SelectOption[]>([]);
  modalCourseOptions = signal<SelectOption[]>([]);
  modalGroupOptions = signal<SelectOption[]>([]);

  assignForm: AssignTeacherRequest = {
    teacherId: '',
    courseId: '',
    classGroupId: ''
  };
  submitting = signal<boolean>(false);
  modalError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDependencies();
    this.loadAssignments();
  }

  loadDependencies(): void {
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        const cOpts = courses.map(c => ({ id: c.id, name: c.name, subtext: c.description || 'Course' }));
        this.filterCourseOptions.set([{ id: '', name: 'All Courses' }, ...cOpts]);
        this.modalCourseOptions.set(cOpts);
      }
    });

    this.courseService.getClassGroups().subscribe({
      next: (groups) => {
        this.classGroups.set(groups);
      }
    });

    this.userService.getUsers(2).subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
        const tOpts = teachers.map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}`, subtext: t.email }));
        this.filterTeacherOptions.set([{ id: '', name: 'All Teachers' }, ...tOpts]);
        this.modalTeacherOptions.set(tOpts);
      }
    });
  }

  loadAssignments(): void {
    this.loading.set(true);
    this.assignmentService.getTeacherAssignments(
      this.selectedFilterTeacherId() || undefined,
      this.selectedFilterCourseId() || undefined
    ).subscribe({
      next: (data) => {
        this.assignments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFilterCourseChange(courseId: string): void {
    this.selectedFilterCourseId.set(courseId);
    this.loadAssignments();
  }

  onFilterTeacherChange(teacherId: string): void {
    this.selectedFilterTeacherId.set(teacherId);
    this.loadAssignments();
  }

  openAssignModal(): void {
    this.isEditMode.set(false);
    this.editingAssignmentId.set(null);
    this.assignForm = {
      teacherId: this.modalTeacherOptions().length > 0 ? this.modalTeacherOptions()[0].id : '',
      courseId: this.modalCourseOptions().length > 0 ? this.modalCourseOptions()[0].id : '',
      classGroupId: ''
    };
    this.modalError.set(null);
    this.onModalCourseSelected(this.assignForm.courseId);
    this.isAssignModalOpen.set(true);
  }

  openEditModal(item: TeacherAssignmentDto): void {
    this.isEditMode.set(true);
    this.editingAssignmentId.set(item.id);

    const foundTeacher = this.teachers().find(t => t.id === item.teacherId);
    const teacherIdToSet = foundTeacher ? foundTeacher.id : item.teacherId;

    this.assignForm = {
      teacherId: teacherIdToSet,
      courseId: item.courseId,
      classGroupId: item.classGroupId || ''
    };
    this.modalError.set(null);
    this.onModalCourseSelected(item.courseId);
    this.assignForm.classGroupId = item.classGroupId || '';
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
    this.isEditMode.set(false);
    this.editingAssignmentId.set(null);
  }

  onModalTeacherSelected(teacherId: string): void {
    this.assignForm.teacherId = teacherId;
  }

  onModalCourseSelected(courseId: string): void {
    this.assignForm.courseId = courseId;
    const groupsForCourse = this.classGroups().filter(g => g.courseId === courseId);
    const gOpts = [
      { id: '', name: 'Whole Course / All Sections' },
      ...groupsForCourse.map(g => ({ id: g.id, name: g.name, subtext: `Capacity: ${g.maximumStudents}` }))
    ];
    this.modalGroupOptions.set(gOpts);
    this.assignForm.classGroupId = gOpts.length > 1 ? gOpts[1].id : '';
  }

  onModalGroupSelected(groupId: string): void {
    this.assignForm.classGroupId = groupId;
  }

  submitAssignment(): void {
    this.modalError.set(null);
    if (!this.assignForm.teacherId || !this.assignForm.courseId) {
      this.modalError.set('Please select both a Teacher and a Course.');
      return;
    }

    this.submitting.set(true);

    if (this.isEditMode()) {
      const id = this.editingAssignmentId();
      if (!id) return;

      this.assignmentService.updateTeacherAssignment(id, {
        teacherId: this.assignForm.teacherId,
        courseId: this.assignForm.courseId,
        classGroupId: this.assignForm.classGroupId || undefined
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeAssignModal();
          this.toast.showSuccess('Teacher allocation updated successfully!');
          this.loadAssignments();
        },
        error: (err) => {
          this.submitting.set(false);
          const errMsg = err?.error?.message || err?.error || 'Failed to update allocation.';
          this.modalError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        }
      });
      return;
    }

    this.assignmentService.assignTeacher({
      teacherId: this.assignForm.teacherId,
      courseId: this.assignForm.courseId,
      classGroupId: this.assignForm.classGroupId || undefined
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeAssignModal();
        this.toast.showSuccess('Teacher assigned to course successfully!');
        this.loadAssignments();
      },
      error: (err) => {
        this.submitting.set(false);
        const errMsg = err?.error?.message || err?.error || 'Failed to assign teacher.';
        this.modalError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      }
    });
  }

  onRemove(assignment: TeacherAssignmentDto): void {
    if (!confirm(`Are you sure you want to remove ${assignment.teacherName}'s assignment to ${assignment.courseName}?`)) {
      return;
    }

    this.assignmentService.removeTeacherAssignment(assignment.id).subscribe({
      next: () => {
        this.toast.showSuccess(`Assignment removed successfully.`);
        this.loadAssignments();
      },
      error: () => {
        this.toast.showError('Failed to remove assignment.');
      }
    });
  }
}
