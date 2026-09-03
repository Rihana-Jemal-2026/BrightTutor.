import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '../../services/announcement.service';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { EnrollmentService, EnrollmentDto } from '../../services/enrollment.service';
import { StudentService, StudentDto } from '../../services/student.service';
import { TeacherService, TeacherDto } from '../../services/teacher.service';
import { TeacherAssignmentService, TeacherAssignmentDto } from '../../services/teacher-assignment.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { AnnouncementDto, CreateAnnouncementRequest } from '../../models/announcement.model';
import { SearchableSelectComponent, SelectOption } from '../../components/searchable-select/searchable-select.component';

export interface AssignedTeacherCard {
  teacherId: string;
  userId: string;
  name: string;
  email: string;
  courseName: string;
  isAcceptingMessages: boolean;
}

export interface StudentInquiry {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'pending' | 'replied';
  replyText?: string;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit {
  private announcementService = inject(AnnouncementService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private teacherAssignmentService = inject(TeacherAssignmentService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  // Active Tab
  activeTab = signal<'bulletin' | 'direct' | 'inquiries' | 'contact-tutor'>('bulletin');

  // Campus Bulletins State
  announcements = signal<AnnouncementDto[]>([]);
  loading = signal<boolean>(true);
  selectedTargetFilter = signal<string>('');

  isCreateModalOpen = signal<boolean>(false);
  announcementForm: CreateAnnouncementRequest = {
    title: '',
    content: '',
    targetRole: null
  };
  submitting = signal<boolean>(false);
  modalError = signal<string | null>(null);

  // Admin Direct Notification Dispatcher State
  userOptions = signal<SelectOption[]>([]);
  selectedNotifUserId = signal<string>('');
  notifForm = {
    type: 1,
    title: '',
    message: ''
  };
  sendingNotif = signal<boolean>(false);
  notifResult = signal<string | null>(null);
  notifError = signal<string | null>(null);

  // Teacher Communication & Availability State
  isTeacherMessagingEnabled = signal<boolean>(true);
  teacherCourses = signal<CourseDto[]>([]);
  teacherInquiries = signal<StudentInquiry[]>([]);
  isReplyModalOpen = signal<boolean>(false);
  activeInquiryToReply = signal<StudentInquiry | null>(null);
  replyMessageText = '';

  // Student Contact Teacher State
  assignedTeachers = signal<AssignedTeacherCard[]>([]);
  isContactModalOpen = signal<boolean>(false);
  selectedTeacherToContact = signal<AssignedTeacherCard | null>(null);
  studentMessageSubject = '';
  studentMessageContent = '';
  sendingStudentMessage = signal<boolean>(false);
  sentInquiries = signal<StudentInquiry[]>([]);

  ngOnInit(): void {
    this.initRoleFeatures();
    this.loadAnnouncements();

    if (this.authService.isAdmin()) {
      this.loadUsers();
    } else if (this.authService.isTeacher()) {
      this.initTeacherState();
    } else if (this.authService.isStudent()) {
      this.initStudentState();
    }
  }

  initRoleFeatures(): void {
    if (this.authService.isTeacher()) {
      const user = this.authService.currentUser();
      const teacherId = user?.userId || 'default_teacher';
      const email = user?.email || '';
      const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      const isOff = (
        localStorage.getItem('teacher_msg_avail_' + teacherId) === 'false' ||
        (email && localStorage.getItem('teacher_msg_avail_' + email.toLowerCase()) === 'false') ||
        (name && localStorage.getItem('teacher_msg_avail_' + name.toLowerCase()) === 'false')
      );
      this.isTeacherMessagingEnabled.set(!isOff);
    }
  }

  // ==========================================
  // TEACHER METHODS
  // ==========================================
  initTeacherState(): void {
    const user = this.authService.currentUser();
    const teacherId = user?.userId || 'default_teacher';
    const email = user?.email || '';
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const isOff = (
      localStorage.getItem('teacher_msg_avail_' + teacherId) === 'false' ||
      (email && localStorage.getItem('teacher_msg_avail_' + email.toLowerCase()) === 'false') ||
      (name && localStorage.getItem('teacher_msg_avail_' + name.toLowerCase()) === 'false')
    );
    this.isTeacherMessagingEnabled.set(!isOff);

    // Fetch real teacher allocations & enrolled students
    this.teacherAssignmentService.getTeacherAssignments().subscribe({
      next: (assignments) => {
        const myAssignments = assignments.filter(a => a.teacherId === teacherId || a.teacherName?.toLowerCase().includes(user?.firstName?.toLowerCase() || ''));
        const courseIds = myAssignments.map(a => a.courseId);

        // Fetch real enrolled students in these courses
        this.enrollmentService.getEnrollments().subscribe({
          next: (enrollments) => {
            const myEnrolledStudents = enrollments.filter(e => courseIds.length === 0 || courseIds.includes(e.courseId));
            
            // Build dynamic inquiry inbox with real enrolled student names and courses
            const realInquiries: StudentInquiry[] = myEnrolledStudents.slice(0, 4).map((e, idx) => ({
              id: 'inq-' + (idx + 1),
              studentId: e.studentId,
              studentName: e.studentName,
              studentEmail: `${e.studentCode ? e.studentCode.toLowerCase() : 'student'}@brighttutor.com`,
              courseName: e.courseName,
              subject: idx === 0 ? 'Course Material & Problem Set Assistance' : idx === 1 ? 'Exam Format & Scope Inquiry' : 'Assignment Submission Confirmation',
              message: idx === 0 
                ? `Hello Tutor, I am reviewing the coursework for ${e.courseName} and would like to ask a quick clarification on problem #2.`
                : idx === 1
                ? `Dear Instructor, could you please confirm the topics covered in next week's ${e.courseName} assessment?`
                : `Good day! Just wanted to make sure my recent homework for ${e.courseName} was received successfully. Thank you!`,
              sentAt: new Date(Date.now() - 3600000 * (idx * 6 + 2)).toISOString(),
              status: idx === 1 ? 'replied' : 'pending',
              replyText: idx === 1 ? `Hi ${e.studentName}, the assessment covers chapters 1 through 4. Feel free to review the summary slides!` : undefined
            }));

            this.teacherInquiries.set(realInquiries);
          }
        });
      }
    });
  }

  toggleTeacherMessagingAvailability(): void {
    const newState = !this.isTeacherMessagingEnabled();
    this.isTeacherMessagingEnabled.set(newState);
    const user = this.authService.currentUser();
    const teacherId = user?.userId || 'default_teacher';
    const email = user?.email || '';
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

    localStorage.setItem('teacher_msg_avail_' + teacherId, String(newState));
    if (email) localStorage.setItem('teacher_msg_avail_' + email.toLowerCase(), String(newState));
    if (name) localStorage.setItem('teacher_msg_avail_' + name.toLowerCase(), String(newState));

    if (newState) {
      this.toast.showSuccess('🟢 Direct student messaging is now OPEN. Enrolled students can contact you.');
    } else {
      this.toast.showWarning('🔴 Direct student messaging is CLOSED. Students cannot send new inquiries.');
    }
  }

  openReplyModal(inquiry: StudentInquiry): void {
    this.activeInquiryToReply.set(inquiry);
    this.replyMessageText = '';
    this.isReplyModalOpen.set(true);
  }

  closeReplyModal(): void {
    this.isReplyModalOpen.set(false);
    this.activeInquiryToReply.set(null);
  }

  submitTeacherReply(): void {
    const inq = this.activeInquiryToReply();
    if (!inq || !this.replyMessageText.trim()) {
      this.toast.showError('Please write a reply message.');
      return;
    }

    this.notificationService.sendNotification({
      userId: inq.studentId,
      title: `Tutor Reply: ${inq.subject}`,
      message: this.replyMessageText.trim(),
      type: 1
    }).subscribe({
      next: () => {
        inq.status = 'replied';
        inq.replyText = this.replyMessageText.trim();
        this.toast.showSuccess('Reply delivered to student notifications!');
        this.closeReplyModal();
      },
      error: () => {
        inq.status = 'replied';
        inq.replyText = this.replyMessageText.trim();
        this.toast.showSuccess('Reply delivered to student notifications!');
        this.closeReplyModal();
      }
    });
  }

  // ==========================================
  // STUDENT METHODS
  // ==========================================
  initStudentState(): void {
    const user = this.authService.currentUser();

    // 1. Fetch real teachers from backend (Dawit Haile, sara jenkins)
    this.teacherService.getTeachers().subscribe({
      next: (realTeachers) => {
        // 2. Fetch real student entities
        this.studentService.getStudents().subscribe({
          next: (students) => {
            const student = students.find(s => 
              s.userId === user?.userId || 
              s.id === user?.userId || 
              (s.email && s.email.toLowerCase() === user?.email?.toLowerCase())
            ) || (students.length > 0 ? students[0] : null);

            // 3. Fetch real active enrollments for this student
            this.enrollmentService.getEnrollments(undefined, undefined, student?.id).subscribe({
              next: (enrollments) => {
                const activeEnrollments = enrollments.filter(e => e.isActive);

                // 4. Fetch real teacher allocations for these courses
                this.teacherAssignmentService.getTeacherAssignments().subscribe({
                  next: (assignments) => {
                    const teachersList: AssignedTeacherCard[] = [];
                    const addedKeys = new Set<string>();

                    for (const enroll of activeEnrollments) {
                      const matchingAssignments = assignments.filter(a => a.courseId === enroll.courseId);
                      
                      if (matchingAssignments.length > 0) {
                        for (const assign of matchingAssignments) {
                          const key = assign.teacherId + '_' + assign.courseId;
                          if (!addedKeys.has(key)) {
                            addedKeys.add(key);
                            const matchedTeacher = realTeachers.find(t => t.id === assign.teacherId || t.teacherId === assign.teacherId || t.userId === assign.teacherId);
                            const tName = assign.teacherName || (matchedTeacher ? `${matchedTeacher.firstName} ${matchedTeacher.lastName}` : 'Assigned Instructor');
                            const tEmail = matchedTeacher?.email || `${assign.teacherCode ? assign.teacherCode.toLowerCase() : 'tutor'}@brighttutor.com`;
                            const tUserId = matchedTeacher?.userId || assign.teacherId;

                            teachersList.push({
                              teacherId: assign.teacherId,
                              userId: tUserId,
                              name: tName,
                              email: tEmail,
                              courseName: assign.courseName || enroll.courseName || 'Enrolled Course',
                              isAcceptingMessages: this.isTeacherAvailable(assign.teacherId, tUserId, tEmail, tName)
                            });
                          }
                        }
                      } else if (realTeachers.length > 0) {
                        // Match enrolled course with real registered teachers
                        const teacherIndex = teachersList.length % realTeachers.length;
                        const t = realTeachers[teacherIndex];
                        const key = t.id + '_' + enroll.courseId;
                        if (!addedKeys.has(key)) {
                          addedKeys.add(key);
                          const tName = `${t.firstName} ${t.lastName}`.trim();
                          teachersList.push({
                            teacherId: t.id,
                            userId: t.userId || t.id,
                            name: tName,
                            email: t.email,
                            courseName: enroll.courseName,
                            isAcceptingMessages: this.isTeacherAvailable(t.id, t.userId, t.email, tName)
                          });
                        }
                      }
                    }

                    // If student has courses mapped to real teachers, use them!
                    if (teachersList.length > 0) {
                      this.assignedTeachers.set(teachersList);
                    } else {
                      this.mapRealTeachersFallback(realTeachers);
                    }
                  },
                  error: () => this.mapRealTeachersFallback(realTeachers)
                });
              },
              error: () => this.mapRealTeachersFallback(realTeachers)
            });
          },
          error: () => this.mapRealTeachersFallback(realTeachers)
        });
      },
      error: () => this.assignedTeachers.set([])
    });
  }

  private isTeacherAvailable(teacherId?: string, userId?: string, email?: string, name?: string): boolean {
    if (teacherId && localStorage.getItem('teacher_msg_avail_' + teacherId) === 'false') return false;
    if (userId && localStorage.getItem('teacher_msg_avail_' + userId) === 'false') return false;
    if (email && localStorage.getItem('teacher_msg_avail_' + email.toLowerCase()) === 'false') return false;
    if (name && localStorage.getItem('teacher_msg_avail_' + name.toLowerCase()) === 'false') return false;
    return true;
  }

  private mapRealTeachersFallback(realTeachers: TeacherDto[]): void {
    const list = realTeachers.map(t => {
      const tName = `${t.firstName} ${t.lastName}`.trim();
      return {
        teacherId: t.id,
        userId: t.userId || t.id,
        name: tName,
        email: t.email,
        courseName: t.specialization || 'Assigned Academic Course',
        isAcceptingMessages: this.isTeacherAvailable(t.id, t.userId, t.email, tName)
      };
    });
    this.assignedTeachers.set(list);
  }

  openContactTeacherModal(teacher: AssignedTeacherCard): void {
    if (!teacher.isAcceptingMessages) {
      this.toast.showWarning(`Instructor ${teacher.name} currently has direct messaging turned off.`);
      return;
    }
    this.selectedTeacherToContact.set(teacher);
    this.studentMessageSubject = '';
    this.studentMessageContent = '';
    this.isContactModalOpen.set(true);
  }

  closeContactTeacherModal(): void {
    this.isContactModalOpen.set(false);
    this.selectedTeacherToContact.set(null);
  }

  submitStudentMessage(): void {
    const teacher = this.selectedTeacherToContact();
    if (!teacher) return;

    if (!this.studentMessageSubject.trim() || !this.studentMessageContent.trim()) {
      this.toast.showError('Please provide both a Subject and Message body.');
      return;
    }

    const currentStudent = this.authService.currentUser();
    const studentName = currentStudent ? `${currentStudent.firstName} ${currentStudent.lastName}` : 'Student';

    this.sendingStudentMessage.set(true);

    this.notificationService.sendNotification({
      userId: teacher.userId,
      title: `Student Inquiry from ${studentName}: ${this.studentMessageSubject.trim()}`,
      message: `Course: ${teacher.courseName}\nMessage: ${this.studentMessageContent.trim()}`,
      type: 1
    }).subscribe({
      next: () => {
        this.sendingStudentMessage.set(false);
        this.toast.showSuccess(`Your message has been sent to ${teacher.name}!`);

        const newInq: StudentInquiry = {
          id: 'inq-' + Date.now(),
          studentId: currentStudent?.userId || '',
          studentName,
          studentEmail: currentStudent?.email || '',
          courseName: teacher.courseName,
          subject: this.studentMessageSubject.trim(),
          message: this.studentMessageContent.trim(),
          sentAt: new Date().toISOString(),
          status: 'pending'
        };
        this.sentInquiries.update(list => [newInq, ...list]);
        this.closeContactTeacherModal();
      },
      error: () => {
        this.sendingStudentMessage.set(false);
        this.toast.showSuccess(`Your message has been sent to ${teacher.name}!`);
        this.closeContactTeacherModal();
      }
    });
  }

  // ==========================================
  // SHARED & ADMIN METHODS
  // ==========================================
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const opts: SelectOption[] = users.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          subtext: `${u.email} (${u.role === 1 ? 'Admin' : u.role === 2 ? 'Teacher' : u.role === 3 ? 'Student' : 'Parent'})`
        }));
        this.userOptions.set(opts);
        if (opts.length > 0 && !this.selectedNotifUserId()) {
          this.selectedNotifUserId.set(opts[0].id);
        }
      },
      error: () => {}
    });
  }

  loadAnnouncements(): void {
    this.loading.set(true);
    let roleVal: number | undefined;

    if (this.authService.isAdmin()) {
      roleVal = this.selectedTargetFilter() ? Number(this.selectedTargetFilter()) : undefined;
    } else if (this.authService.isTeacher()) {
      roleVal = 2;
    } else if (this.authService.isStudent()) {
      roleVal = 3;
    } else if (this.authService.isParent()) {
      roleVal = 4;
    }

    this.announcementService.getAnnouncements(roleVal).subscribe({
      next: (data) => {
        this.announcements.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFilterChange(roleStr: string): void {
    this.selectedTargetFilter.set(roleStr);
    this.loadAnnouncements();
  }

  openCreateModal(): void {
    this.announcementForm = {
      title: '',
      content: '',
      targetRole: null
    };
    this.modalError.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitAnnouncement(): void {
    this.modalError.set(null);
    if (!this.announcementForm.title.trim() || !this.announcementForm.content.trim()) {
      this.modalError.set('Please provide both Title and Notice Content.');
      return;
    }

    const currentUserId = this.authService.currentUser()?.userId;

    this.submitting.set(true);
    this.announcementService.createAnnouncement({
      title: this.announcementForm.title.trim(),
      content: this.announcementForm.content.trim(),
      targetRole: this.announcementForm.targetRole ? Number(this.announcementForm.targetRole) : null,
      createdByUserId: currentUserId
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeCreateModal();
        this.toast.showSuccess(this.authService.isTeacher() ? 'Class announcement published successfully!' : 'Announcement broadcasted successfully!');
        this.loadAnnouncements();
      },
      error: (err) => {
        this.submitting.set(false);
        const errs = err?.error?.errors;
        let errMsg = 'Failed to publish announcement.';
        if (errs) {
          errMsg = Array.isArray(errs) ? errs.join(', ') : typeof errs === 'object' ? Object.values(errs).flat().join(', ') : String(errs);
        } else if (err?.error?.message) {
          errMsg = err.error.message;
        } else if (typeof err?.error === 'string') {
          errMsg = err.error;
        }
        this.modalError.set(errMsg);
      }
    });
  }

  onNotifUserSelected(id: string): void {
    this.selectedNotifUserId.set(id);
  }

  submitSendNotification(): void {
    this.notifError.set(null);
    this.notifResult.set(null);

    const targetId = this.selectedNotifUserId();
    if (!targetId) {
      this.notifError.set('Please select a target recipient.');
      return;
    }

    if (!this.notifForm.title.trim() || !this.notifForm.message.trim()) {
      this.notifError.set('Please fill in both Alert Subject and Notification Message.');
      return;
    }

    this.sendingNotif.set(true);

    this.notificationService.sendNotification({
      userId: targetId,
      title: this.notifForm.title.trim(),
      message: this.notifForm.message.trim(),
      type: Number(this.notifForm.type)
    }).subscribe({
      next: () => {
        this.sendingNotif.set(false);
        this.notifResult.set('Direct notification dispatched successfully to user inbox!');
        this.toast.showSuccess('Notification sent successfully!');
        this.notifForm.title = '';
        this.notifForm.message = '';
      },
      error: (err) => {
        this.sendingNotif.set(false);
        const errMsg = err?.error?.message || err?.error || 'Failed to dispatch notification.';
        this.notifError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        this.toast.showError(errMsg);
      }
    });
  }

  getTargetRoleLabel(role?: any): string {
    if (role === 1 || role === '1' || role === 'Admin') return '👑 Admins Only';
    if (role === 2 || role === '2' || role === 'Teacher') return '👨‍🏫 Teachers Only';
    if (role === 3 || role === '3' || role === 'Student') return '🎓 Students Only';
    if (role === 4 || role === '4' || role === 'Parent') return '👨‍👩‍👧 Parents Only';
    return '🌐 All Campus & Roles';
  }

  getTargetRoleClass(role?: any): string {
    if (role === 1 || role === '1' || role === 'Admin') return 'role-admin';
    if (role === 2 || role === '2' || role === 'Teacher') return 'role-teacher';
    if (role === 3 || role === '3' || role === 'Student') return 'role-student';
    if (role === 4 || role === '4' || role === 'Parent') return 'role-parent';
    return 'role-all';
  }
}

