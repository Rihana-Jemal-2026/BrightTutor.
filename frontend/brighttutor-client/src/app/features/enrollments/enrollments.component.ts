import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrollmentService } from '../../services/enrollment.service';
import { CourseService, CourseDto, ClassGroupDto } from '../../services/course.service';
import { UserService, UserDto } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { EnrollmentDto, EnrollStudentRequest } from '../../models/enrollment.model';
import { SearchableSelectComponent, SelectOption } from '../../components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './enrollments.component.html',
  styleUrl: './enrollments.component.scss'
})
export class EnrollmentsComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  enrollments = signal<EnrollmentDto[]>([]);
  courses = signal<CourseDto[]>([]);
  classGroups = signal<ClassGroupDto[]>([]);
  students = signal<UserDto[]>([]);
  loading = signal<boolean>(true);

  // Filter dropdown options
  filterCourseOptions = signal<SelectOption[]>([]);
  filterGroupOptions = signal<SelectOption[]>([]);
  selectedFilterCourseId = signal<string>('');
  selectedFilterGroupId = signal<string>('');

  // Modal State
  isEnrollModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingEnrollmentId = signal<string | null>(null);

  modalStudentOptions = signal<SelectOption[]>([]);
  modalCourseOptions = signal<SelectOption[]>([]);
  modalGroupOptions = signal<SelectOption[]>([]);

  enrollForm: EnrollStudentRequest = {
    studentId: '',
    courseId: '',
    classGroupId: ''
  };

  submitting = signal<boolean>(false);
  modalError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDependencies();
    this.loadEnrollments();
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
        this.updateFilterGroupOptions('');
      }
    });

    this.userService.getUsers(3).subscribe({
      next: (students) => {
        this.students.set(students);
        const sOpts = students.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          subtext: s.email
        }));
        this.modalStudentOptions.set(sOpts);
      }
    });
  }

  loadEnrollments(): void {
    this.loading.set(true);
    const courseId = this.selectedFilterCourseId() || undefined;
    const groupId = this.selectedFilterGroupId() || undefined;

    this.enrollmentService.getEnrollments(courseId, groupId).subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFilterCourseChange(courseId: string): void {
    this.selectedFilterCourseId.set(courseId);
    this.updateFilterGroupOptions(courseId);
    this.selectedFilterGroupId.set('');
    this.loadEnrollments();
  }

  onFilterGroupChange(groupId: string): void {
    this.selectedFilterGroupId.set(groupId);
    this.loadEnrollments();
  }

  updateFilterGroupOptions(courseId: string): void {
    const allGroups = this.classGroups();
    const filtered = courseId ? allGroups.filter(g => g.courseId === courseId) : allGroups;
    const gOpts = filtered.map(g => ({ id: g.id, name: g.name, subtext: g.courseName }));
    this.filterGroupOptions.set([{ id: '', name: 'All Class Groups' }, ...gOpts]);
  }

  openEnrollModal(): void {
    this.isEditMode.set(false);
    this.editingEnrollmentId.set(null);
    this.enrollForm = {
      studentId: this.modalStudentOptions().length > 0 ? this.modalStudentOptions()[0].id : '',
      courseId: this.modalCourseOptions().length > 0 ? this.modalCourseOptions()[0].id : '',
      classGroupId: ''
    };
    this.modalError.set(null);
    this.onModalCourseSelected(this.enrollForm.courseId);
    this.isEnrollModalOpen.set(true);
  }

  openEditModal(enrollment: EnrollmentDto): void {
    this.isEditMode.set(true);
    this.editingEnrollmentId.set(enrollment.id);

    // Look up student by studentId or user id
    const foundStudent = this.students().find(s => s.id === enrollment.studentId);
    const studentIdToSet = foundStudent ? foundStudent.id : enrollment.studentId;

    this.enrollForm = {
      studentId: studentIdToSet,
      courseId: enrollment.courseId,
      classGroupId: enrollment.classGroupId || ''
    };
    this.modalError.set(null);

    // Update group options for the current enrolled course
    this.onModalCourseSelected(enrollment.courseId);
    this.enrollForm.classGroupId = enrollment.classGroupId || '';

    this.isEnrollModalOpen.set(true);
  }

  closeEnrollModal(): void {
    this.isEnrollModalOpen.set(false);
    this.isEditMode.set(false);
    this.editingEnrollmentId.set(null);
  }

  onModalStudentSelected(studentId: string): void {
    this.enrollForm.studentId = studentId;
  }

  onModalCourseSelected(courseId: string): void {
    this.enrollForm.courseId = courseId;
    const groupsForCourse = this.classGroups().filter(g => g.courseId === courseId);
    const gOpts = [
      { id: '', name: 'No Specific Group (General Course)' },
      ...groupsForCourse.map(g => ({ id: g.id, name: g.name, subtext: `Capacity: ${g.maximumStudents}` }))
    ];
    this.modalGroupOptions.set(gOpts);
    this.enrollForm.classGroupId = gOpts.length > 1 ? gOpts[1].id : '';
  }

  onModalGroupSelected(groupId: string): void {
    this.enrollForm.classGroupId = groupId;
  }

  submitEnrollment(): void {
    this.modalError.set(null);

    if (!this.enrollForm.courseId) {
      this.modalError.set('Please select a course.');
      return;
    }

    if (this.isEditMode()) {
      const id = this.editingEnrollmentId();
      if (!id) return;

      this.submitting.set(true);
      this.enrollmentService.updateEnrollment(id, {
        courseId: this.enrollForm.courseId,
        classGroupId: this.enrollForm.classGroupId || undefined,
        isActive: true
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeEnrollModal();
          this.toast.showSuccess('Enrollment updated successfully!');
          this.loadEnrollments();
        },
        error: (err) => {
          this.submitting.set(false);
          const errMsg = err?.error?.message || err?.error || 'Failed to update enrollment.';
          this.modalError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        }
      });
      return;
    }

    if (!this.enrollForm.studentId) {
      this.modalError.set('Please select a student.');
      return;
    }

    this.submitting.set(true);
    this.enrollmentService.enrollStudent({
      studentId: this.enrollForm.studentId,
      courseId: this.enrollForm.courseId,
      classGroupId: this.enrollForm.classGroupId || undefined
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeEnrollModal();
        this.toast.showSuccess('Student enrolled successfully!');
        this.loadEnrollments();
      },
      error: (err) => {
        this.submitting.set(false);
        const errMsg = err?.error?.message || err?.error || 'Failed to enroll student. Verify student is not already enrolled.';
        this.modalError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      }
    });
  }

  onUnenroll(enrollment: EnrollmentDto): void {
    if (!confirm(`Are you sure you want to unenroll ${enrollment.studentName} from ${enrollment.courseName}?`)) {
      return;
    }

    this.enrollmentService.unenrollStudent(enrollment.id).subscribe({
      next: () => {
        this.toast.showSuccess(`Unenrolled ${enrollment.studentName} successfully.`);
        this.loadEnrollments();
      },
      error: () => {
        this.toast.showError('Failed to unenroll student.');
      }
    });
  }
}
