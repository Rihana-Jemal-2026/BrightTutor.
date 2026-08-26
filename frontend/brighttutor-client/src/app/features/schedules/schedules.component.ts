import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../../services/schedule.service';
import { CourseService, CourseDto, ClassGroupDto } from '../../services/course.service';
import { UserService, UserDto } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { ScheduleDto, CreateScheduleRequest, ScheduleStatus, ServiceType } from '../../models/schedule.model';
import { SearchableSelectComponent, SelectOption } from '../../components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.scss'
})
export class SchedulesComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  ScheduleStatus = ScheduleStatus;
  ServiceType = ServiceType;

  schedules = signal<ScheduleDto[]>([]);
  courses = signal<CourseDto[]>([]);
  classGroups = signal<ClassGroupDto[]>([]);
  teachers = signal<UserDto[]>([]);
  students = signal<UserDto[]>([]);
  loading = signal<boolean>(true);

  // Filter signals
  filterCourseOptions = signal<SelectOption[]>([]);
  filterGroupOptions = signal<SelectOption[]>([]);
  filterTeacherOptions = signal<SelectOption[]>([]);
  selectedFilterCourseId = signal<string>('');
  selectedFilterGroupId = signal<string>('');
  selectedFilterTeacherId = signal<string>('');
  selectedFilterStatus = signal<string>('');

  // Modal State
  isCreateModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingScheduleId = signal<string | null>(null);

  modalCourseOptions = signal<SelectOption[]>([]);
  modalGroupOptions = signal<SelectOption[]>([]);
  modalTeacherOptions = signal<SelectOption[]>([]);
  modalStudentOptions = signal<SelectOption[]>([]);

  scheduleForm: CreateScheduleRequest = {
    courseId: '',
    teacherId: '',
    classGroupId: '',
    studentId: '',
    serviceType: ServiceType.Group,
    startTime: '',
    endTime: '',
    meetingLink: '',
    locationAddress: ''
  };

  submitting = signal<boolean>(false);
  modalError = signal<string | null>(null);

  ngOnInit(): void {
    this.initDefaultTimes();
    this.loadDependencies();
    this.loadSchedules();
  }

  initDefaultTimes(): void {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    this.scheduleForm.startTime = `${todayStr}T09:00`;
    this.scheduleForm.endTime = `${todayStr}T10:30`;
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

    this.userService.getUsers(2).subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
        const tOpts = teachers.map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}`, subtext: t.email }));
        this.filterTeacherOptions.set([{ id: '', name: 'All Teachers' }, ...tOpts]);
        this.modalTeacherOptions.set(tOpts);
      }
    });

    this.userService.getUsers(3).subscribe({
      next: (students) => {
        this.students.set(students);
        const sOpts = students.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, subtext: s.email }));
        this.modalStudentOptions.set(sOpts);
      }
    });
  }

  loadSchedules(): void {
    this.loading.set(true);
    const statusVal = this.selectedFilterStatus() ? Number(this.selectedFilterStatus()) : undefined;

    this.scheduleService.getSchedules({
      courseId: this.selectedFilterCourseId() || undefined,
      classGroupId: this.selectedFilterGroupId() || undefined,
      teacherId: this.selectedFilterTeacherId() || undefined,
      status: statusVal
    }).subscribe({
      next: (data) => {
        this.schedules.set(data);
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
    this.loadSchedules();
  }

  onFilterGroupChange(groupId: string): void {
    this.selectedFilterGroupId.set(groupId);
    this.loadSchedules();
  }

  onFilterTeacherChange(teacherId: string): void {
    this.selectedFilterTeacherId.set(teacherId);
    this.loadSchedules();
  }

  onFilterStatusChange(status: string): void {
    this.selectedFilterStatus.set(status);
    this.loadSchedules();
  }

  updateFilterGroupOptions(courseId: string): void {
    const allGroups = this.classGroups();
    const filtered = courseId ? allGroups.filter(g => g.courseId === courseId) : allGroups;
    const gOpts = filtered.map(g => ({ id: g.id, name: g.name, subtext: g.courseName }));
    this.filterGroupOptions.set([{ id: '', name: 'All Class Groups' }, ...gOpts]);
  }

  onServiceTypeChanged(type: ServiceType): void {
    this.scheduleForm.serviceType = type;
    if (type === ServiceType.Group) {
      this.scheduleForm.studentId = '';
    } else {
      this.scheduleForm.classGroupId = '';
    }
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingScheduleId.set(null);
    this.initDefaultTimes();
    const currentUserId = this.authService.currentUser()?.userId || '';
    const isCurrentTeacher = this.authService.isTeacher();

    this.scheduleForm = {
      courseId: this.modalCourseOptions().length > 0 ? this.modalCourseOptions()[0].id : '',
      teacherId: isCurrentTeacher ? currentUserId : (this.modalTeacherOptions().length > 0 ? this.modalTeacherOptions()[0].id : ''),
      classGroupId: '',
      studentId: '',
      serviceType: ServiceType.Group,
      startTime: this.scheduleForm.startTime,
      endTime: this.scheduleForm.endTime,
      meetingLink: '',
      locationAddress: ''
    };
    this.modalError.set(null);
    this.onModalCourseSelected(this.scheduleForm.courseId);
    this.isCreateModalOpen.set(true);
  }

  openEditModal(schedule: ScheduleDto): void {
    this.isEditMode.set(true);
    this.editingScheduleId.set(schedule.id);

    // Format local datetime strings for datetime-local inputs
    const startIso = schedule.startTime ? new Date(schedule.startTime).toISOString().substring(0, 16) : '';
    const endIso = schedule.endTime ? new Date(schedule.endTime).toISOString().substring(0, 16) : '';

    // Match teacher/student
    const foundTeacher = this.teachers().find(t => t.id === schedule.teacherId);
    const teacherIdToSet = foundTeacher ? foundTeacher.id : schedule.teacherId;

    const foundStudent = this.students().find(s => s.id === schedule.studentId);
    const studentIdToSet = foundStudent ? foundStudent.id : (schedule.studentId || '');

    const rawType = schedule.serviceType as any;
    const parsedServiceType = (rawType === 'Online' || rawType === 1 || rawType === '1')
      ? ServiceType.Online
      : (rawType === 'Group' || rawType === 2 || rawType === '2')
        ? ServiceType.Group
        : ServiceType.Home;

    this.scheduleForm = {
      courseId: schedule.courseId,
      teacherId: teacherIdToSet,
      classGroupId: parsedServiceType === ServiceType.Group ? (schedule.classGroupId || '') : '',
      studentId: parsedServiceType !== ServiceType.Group ? studentIdToSet : '',
      serviceType: parsedServiceType,
      startTime: startIso,
      endTime: endIso,
      meetingLink: schedule.meetingLink || '',
      locationAddress: schedule.locationAddress || ''
    };
    this.modalError.set(null);
    this.onModalCourseSelected(schedule.courseId);
    if (parsedServiceType === ServiceType.Group) {
      this.scheduleForm.classGroupId = schedule.classGroupId || '';
    }
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.isEditMode.set(false);
    this.editingScheduleId.set(null);
  }

  onModalCourseSelected(courseId: string): void {
    this.scheduleForm.courseId = courseId;
    const groupsForCourse = this.classGroups().filter(g => g.courseId === courseId);
    const gOpts = [
      { id: '', name: 'No Specific Group (General Course)' },
      ...groupsForCourse.map(g => ({ id: g.id, name: g.name, subtext: `Capacity: ${g.maximumStudents}` }))
    ];
    this.modalGroupOptions.set(gOpts);
    this.scheduleForm.classGroupId = gOpts.length > 1 ? gOpts[1].id : '';
  }

  onModalGroupSelected(groupId: string): void {
    this.scheduleForm.classGroupId = groupId;
  }

  onModalTeacherSelected(teacherId: string): void {
    this.scheduleForm.teacherId = teacherId;
  }

  onModalStudentSelected(studentId: string): void {
    this.scheduleForm.studentId = studentId;
  }

  submitSchedule(): void {
    this.modalError.set(null);
    if (!this.scheduleForm.courseId || !this.scheduleForm.teacherId) {
      this.modalError.set('Please select both a Course and an Assigned Teacher.');
      return;
    }

    if (!this.scheduleForm.startTime || !this.scheduleForm.endTime) {
      this.modalError.set('Please provide both Start Time and End Time.');
      return;
    }

    if (new Date(this.scheduleForm.endTime) <= new Date(this.scheduleForm.startTime)) {
      this.modalError.set('End Time must be later than Start Time.');
      return;
    }

    const isGroup = this.scheduleForm.serviceType === ServiceType.Group;
    const studentToSubmit = isGroup ? undefined : (this.scheduleForm.studentId || undefined);
    const groupToSubmit = isGroup ? (this.scheduleForm.classGroupId || undefined) : undefined;

    this.submitting.set(true);

    if (this.isEditMode()) {
      const id = this.editingScheduleId();
      if (!id) return;

      this.scheduleService.updateSchedule(id, {
        scheduleId: id,
        courseId: this.scheduleForm.courseId,
        teacherId: this.scheduleForm.teacherId,
        classGroupId: groupToSubmit,
        studentId: studentToSubmit,
        serviceType: Number(this.scheduleForm.serviceType),
        startTime: new Date(this.scheduleForm.startTime).toISOString(),
        endTime: new Date(this.scheduleForm.endTime).toISOString(),
        meetingLink: this.scheduleForm.meetingLink || undefined,
        locationAddress: this.scheduleForm.locationAddress || undefined
      }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeCreateModal();
          this.toast.showSuccess('Timetable session updated successfully!');
          this.loadSchedules();
        },
        error: (err) => {
          this.submitting.set(false);
          const errMsg = err?.error?.message || err?.error || 'Failed to update schedule.';
          this.modalError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        }
      });
      return;
    }

    this.scheduleService.createSchedule({
      courseId: this.scheduleForm.courseId,
      teacherId: this.scheduleForm.teacherId,
      classGroupId: groupToSubmit,
      studentId: studentToSubmit,
      serviceType: Number(this.scheduleForm.serviceType),
      startTime: new Date(this.scheduleForm.startTime).toISOString(),
      endTime: new Date(this.scheduleForm.endTime).toISOString(),
      meetingLink: this.scheduleForm.meetingLink || undefined,
      locationAddress: this.scheduleForm.locationAddress || undefined
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeCreateModal();
        this.toast.showSuccess('Timetable session scheduled successfully!');
        this.loadSchedules();
      },
      error: (err) => {
        this.submitting.set(false);
        const errMsg = err?.error?.message || err?.error || 'Failed to schedule session. Verify start and end times.';
        this.modalError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      }
    });
  }

  updateStatus(schedule: ScheduleDto, newStatus: ScheduleStatus): void {
    this.scheduleService.updateScheduleStatus(schedule.id, newStatus).subscribe({
      next: () => {
        this.toast.showSuccess(`Schedule status updated to ${this.getStatusLabel(newStatus)}.`);
        this.loadSchedules();
      },
      error: () => {
        this.toast.showError('Failed to update schedule status.');
      }
    });
  }

  isScheduled(status: any): boolean {
    return status === 'Scheduled' || (status as any) === ScheduleStatus.Scheduled || status === 1 || status === '1';
  }

  isCompleted(status: any): boolean {
    return status === 'Completed' || (status as any) === ScheduleStatus.Completed || status === 2 || status === '2';
  }

  isCancelled(status: any): boolean {
    return status === 'Cancelled' || (status as any) === ScheduleStatus.Cancelled || status === 3 || status === '3';
  }

  getStatusLabel(status: any): string {
    if (this.isScheduled(status)) return 'Scheduled';
    if (this.isCompleted(status)) return 'Completed';
    if (this.isCancelled(status)) return 'Cancelled';
    if (status === 'Rescheduled' || status === 4 || status === '4') return 'Rescheduled';
    return String(status || 'Scheduled');
  }

  getServiceTypeLabel(type: any): string {
    if (type === 'Group' || type === 2 || type === '2' || type === ServiceType.Group) return '👥 Group Class';
    if (type === 'Online' || type === 1 || type === '1' || type === ServiceType.Online) return '💻 Online 1-on-1';
    if (type === 'Home' || type === 'HomeToHome' || type === 3 || type === '3' || type === ServiceType.Home) return '🏠 Home Tutoring';
    return '👥 ' + String(type || 'Class Session');
  }

  getServiceTypeClass(type: any): string {
    if (type === 'Group' || type === 2 || type === '2') return 'type-group';
    if (type === 'Online' || type === 1 || type === '1') return 'type-online';
    if (type === 'Home' || type === 'HomeToHome' || type === 3 || type === '3') return 'type-home';
    return 'type-general';
  }

  getStatusClass(status: any): string {
    if (this.isScheduled(status)) return 'status-1';
    if (this.isCompleted(status)) return 'status-2';
    if (this.isCancelled(status)) return 'status-3';
    return 'status-4';
  }

  isGroupService(type: any): boolean {
    return type === 'Group' || type === 2 || type === '2' || type === ServiceType.Group;
  }
}
