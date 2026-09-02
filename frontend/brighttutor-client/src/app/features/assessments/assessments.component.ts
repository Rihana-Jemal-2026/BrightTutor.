import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AssessmentService } from '../../services/assessment.service';
import { CourseService } from '../../services/course.service';
import { StudentService, StudentDto } from '../../services/student.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { CertificateService, CertificateDto } from '../../services/certificate.service';
import { AssessmentDto, MasterGradebookResponse, MasterGradebookRow, QuizQuestion } from '../../models/assessment.model';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="assessments-page">
      <!-- HEADER -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon-box">📚</div>
          <div>
            <h1 class="page-title">Homework, Tests, Gradebook & Certification</h1>
            <p class="page-subtitle">Multi-assessment management, automated test evaluation, dynamic weighted gradebook & official certificate issuance.</p>
        </div>

        @if (authService.isAdmin() || authService.isSuperAdmin() || authService.isTeacher()) {
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateModal()">
              <span class="icon">➕</span> Create Assessment / Test
            </button>
          </div>
        }
      </div>

      <!-- NAVIGATION TABS -->
      <div class="nav-tabs-container">
        <div class="nav-tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'assessments'" (click)="setTab('assessments')">
            <span class="tab-icon">📑</span> Course Tasks & Tests
            <span class="tab-badge">{{ assessments().length }}</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'gradebook'" (click)="setTab('gradebook')">
            <span class="tab-icon">📊</span> Master Gradebook Matrix
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'final-grading'" (click)="setTab('final-grading')">
            <span class="tab-icon">🎓</span> Final Course Grading & Certificates
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'student-view'" (click)="setTab('student-view')">
            <span class="tab-icon">👤</span> Student Portal & My Grades
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- TAB 1: ASSESSMENTS LIST & TASKS -->
      <!-- ========================================== -->
      @if (activeTab() === 'assessments') {
        <div class="tab-pane">
          <!-- Filter Bar -->
          <div class="filters-card">
            <div class="filter-group">
              <label>Filter by Course</label>
              <select [(ngModel)]="filterCourseId" (change)="loadAssessments()" class="form-control">
                <option value="">All Courses</option>
                @for (c of courses(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
            </div>

            <div class="filter-group">
              <label>Assessment Type</label>
              <div class="type-pill-group">
                <button class="type-pill" [class.active]="filterType === null" (click)="setFilterType(null)">All</button>
                <button class="type-pill pill-hw" [class.active]="filterType === 1" (click)="setFilterType(1)">Homework</button>
                <button class="type-pill pill-quiz" [class.active]="filterType === 2" (click)="setFilterType(2)">Quizzes</button>
                <button class="type-pill pill-test" [class.active]="filterType === 3" (click)="setFilterType(3)">Tests & Exams</button>
              </div>
            </div>
          </div>

          <!-- Assessments Grid -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading course assessments and quiz tests...</p>
            </div>
          } @else if (assessments().length === 0) {
            <div class="empty-state-card">
              <div class="empty-icon">📚</div>
              <h3>No Assessments Found</h3>
              <p>No homework, quizzes, or tests match your filters.</p>
              @if (authService.isAdmin() || authService.isSuperAdmin() || authService.isTeacher()) {
                <button class="btn btn-primary" (click)="openCreateModal()">➕ Create First Assessment</button>
              }
            </div>
          } @else {
            <div class="assessments-grid">
              @for (a of assessments(); track a.id) {
                <div class="assessment-card" [ngClass]="getCardTypeClass(a.type)">
                  <div class="card-header">
                    <span class="type-tag" [ngClass]="getTypeTagClass(a.type)">{{ a.typeName }}</span>
                    <div class="header-right-meta">
                      <span class="weight-badge">⚖️ {{ a.weightPercentage }}% Weight</span>
                      @if (authService.isAdmin() || authService.isSuperAdmin() || authService.isTeacher()) {
                        <button type="button" class="btn-card-edit" (click)="openEditModal(a)" title="Edit Assessment & Questions">✏️</button>
                        <button type="button" class="btn-card-delete" (click)="deleteAssessment(a.id)" title="Delete Assessment">🗑️</button>
                      }
                    </div>
                  </div>

                  <h3 class="assessment-title">{{ a.title }}</h3>
                  <p class="assessment-course">📖 {{ a.courseName }}</p>
                  <p class="assessment-desc">{{ a.description }}</p>

                  <div class="assessment-meta">
                    <div class="meta-item">
                      <span class="meta-label">Max Score:</span>
                      <span class="meta-value">{{ a.maxScore }} pts</span>
                    </div>
                    @if (a.durationMinutes) {
                      <div class="meta-item">
                        <span class="meta-label">Time Limit:</span>
                        <span class="meta-value">⏱️ {{ a.durationMinutes }} mins</span>
                      </div>
                    }
                    <div class="meta-item">
                      <span class="meta-label">Due Date:</span>
                      <span class="meta-value due-date">{{ formatDueDate(a.dueDate) }}</span>
                    </div>
                    @if (authService.isAdmin() || authService.isSuperAdmin() || authService.isTeacher()) {
                      <div class="meta-item">
                        <span class="meta-label">Submissions:</span>
                        <span class="meta-value submissions-badge">{{ a.submissionsCount }} ({{ a.gradedCount }} graded)</span>
                      </div>
                    }
                  </div>

                  <!-- Action Buttons -->
                  <div class="card-footer">
                    @if (a.hasQuestions || a.type === 2 || a.type === 3) {
                      <button class="btn btn-quiz-take" (click)="openTakeQuizModal(a)">
                        ⏱️ Take Interactive Test
                      </button>
                    } @else {
                      <button class="btn btn-submit-hw" (click)="openSubmitHwModal(a)">
                        📤 Submit Homework
                      </button>
                    }
                    @if (authService.isAdmin() || authService.isSuperAdmin() || authService.isTeacher()) {
                      <button class="btn btn-edit-action" (click)="openEditModal(a)">
                        ✏️ Edit
                      </button>
                      <button class="btn btn-review" (click)="openSubmissionsModal(a)">
                        📥 Submissions ({{ a.submissionsCount }})
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================== -->
      <!-- TAB 2: MASTER GRADEBOOK MATRIX -->
      <!-- ========================================== -->
      @if (activeTab() === 'gradebook') {
        <div class="tab-pane">
          <div class="gradebook-controls">
            <div class="control-select">
              <label>Select Course for Master Gradebook:</label>
              <select [(ngModel)]="selectedGradebookCourseId" (change)="loadMasterGradebook()" class="form-control course-selector">
                @for (c of courses(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
            </div>

            <div class="gradebook-legend">
              <span class="legend-item"><span class="dot dot-hw"></span> Homework (30%)</span>
              <span class="legend-item"><span class="dot dot-quiz"></span> Quizzes (30%)</span>
              <span class="legend-item"><span class="dot dot-test"></span> Tests (40%)</span>
            </div>
          </div>

          @if (gradebookLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Calculating weighted gradebook matrix...</p>
            </div>
          } @else if (!gradebookData() || gradebookData()!.students.length === 0) {
            <div class="empty-state-card">
              <div class="empty-icon">📊</div>
              <h3>No Enrolled Students in this Course</h3>
              <p>Enroll students in this course to view the live grading matrix.</p>
            </div>
          } @else {
            <div class="table-responsive gradebook-table-container">
              <table class="table gradebook-table">
                <thead>
                  <tr>
                    <th class="sticky-col">Student</th>
                    <th>ID Code</th>
                    <th class="th-cat cat-hw">HW Avg (30%)</th>
                    <th class="th-cat cat-quiz">Quiz Avg (30%)</th>
                    <th class="th-cat cat-test">Test Avg (40%)</th>
                    <th class="th-total">Final Weighted %</th>
                    <th class="th-grade">Letter Grade</th>
                    <th class="th-honors">Honors Tier</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of gradebookData()!.students; track row.studentId) {
                    <tr>
                      <td class="sticky-col student-cell">
                        @if (row.profilePhotoUrl) {
                          <img [src]="row.profilePhotoUrl" alt="" class="student-thumb" />
                        } @else {
                          <span class="student-avatar-fallback">👤</span>
                        }
                        <span class="student-name">{{ row.studentName }}</span>
                      </td>
                      <td><span class="code-badge">{{ row.studentCode }}</span></td>
                      <td class="score-cell hw-score">{{ row.hwAverage }}%</td>
                      <td class="score-cell quiz-score">{{ row.quizAverage }}%</td>
                      <td class="score-cell test-score">{{ row.testAverage }}%</td>
                      <td class="score-cell total-score">
                        <strong>{{ row.cumulativeScore }}%</strong>
                      </td>
                      <td>
                        <span class="letter-badge" [ngClass]="getLetterGradeClass(row.suggestedLetterGrade)">
                          {{ row.suggestedLetterGrade }}
                        </span>
                      </td>
                      <td>
                        <span class="honors-tag">{{ row.honorsDistinction }}</span>
                      </td>
                      <td>
                        @if (row.isFinalized) {
                          <span class="status-badge status-finalized">🔒 Finalized</span>
                        } @else {
                          <span class="status-badge status-active">⏳ In Progress</span>
                        }
                      </td>
                      <td>
                        <button class="btn btn-sm btn-finalize" (click)="openFinalizeModal(row)">
                          🎓 {{ row.isFinalized ? 'View / Update Grade' : 'Finalize Grade' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- ========================================== -->
      <!-- TAB 3: FINAL COURSE GRADING & CERTIFICATES -->
      <!-- ========================================== -->
      @if (activeTab() === 'final-grading') {
        <div class="tab-pane">
          <div class="final-grading-banner">
            <div class="banner-icon">🏆</div>
            <div>
              <h2>Course Completion & Digital Certificate Authority</h2>
              <p>Finalize the student's cumulative GPA to generate their verified <strong>Digital Certificate of Completion & Honors</strong>.</p>
            </div>
          </div>

          <!-- Dedicated Course Selector for Final Grading -->
          <div class="final-grading-controls">
            <div class="selector-group">
              <label for="finalCourseSelect">Select Course for Final Grading & Certificates:</label>
              <select id="finalCourseSelect" [(ngModel)]="selectedFinalGradingCourseId" (change)="onFinalGradingCourseChange()" class="form-control course-select">
                <option value="">-- Choose Course --</option>
                @for (c of courses(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
            </div>
            <div class="summary-stats-pills">
              <span class="stat-pill">👥 Students: <strong>{{ finalGradingData()?.students?.length || 0 }}</strong></span>
              <span class="stat-pill stat-issued">📜 Issued Certificates: <strong>{{ getIssuedCertsCount() }}</strong></span>
            </div>
          </div>

          @if (finalGradingLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading course completion roster and grades...</p>
            </div>
          } @else if (!finalGradingData() || finalGradingData()!.students.length === 0) {
            <div class="empty-state-card">
              <div class="empty-icon">🎓</div>
              <h3>No Enrolled Students for This Course</h3>
              <p>Select a different course above to view students and issue certificates.</p>
            </div>
          } @else {
            <div class="final-cards-grid">
              @for (row of finalGradingData()!.students; track row.studentId) {
                <div class="final-student-card" [class.card-finalized]="row.isFinalized">
                  <div class="card-top">
                    @if (row.profilePhotoUrl) {
                      <img [src]="row.profilePhotoUrl" class="final-avatar" alt="" />
                    } @else {
                      <div class="final-avatar-fallback">👤</div>
                    }
                    <div>
                      <h3>{{ row.studentName }}</h3>
                      <span class="code-badge">{{ row.studentCode }}</span>
                    </div>
                  </div>

                  <div class="score-breakdown-box">
                    <div class="breakdown-item">
                      <span>Homework (30%):</span>
                      <strong>{{ row.hwAverage }}%</strong>
                    </div>
                    <div class="breakdown-item">
                      <span>Quizzes (30%):</span>
                      <strong>{{ row.quizAverage }}%</strong>
                    </div>
                    <div class="breakdown-item">
                      <span>Tests & Exams (40%):</span>
                      <strong>{{ row.testAverage }}%</strong>
                    </div>
                    <div class="breakdown-total">
                      <span>Final Weighted Score:</span>
                      <span class="total-percent">{{ row.cumulativeScore }}% ({{ row.suggestedLetterGrade }})</span>
                    </div>
                  </div>

                  <div class="honors-award-box">
                    <span class="award-icon">🎖️</span>
                    <span>Honors Tier: <strong>{{ row.honorsDistinction }}</strong></span>
                  </div>

                  @if (row.isFinalized) {
                    <div class="cert-issued-alert">
                      <span class="alert-icon">✅</span>
                      <div>
                        <strong>Certificate Issued!</strong>
                        <p>Official completion certificate is active and verified.</p>
                      </div>
                    </div>
                    <button type="button" class="btn btn-view-cert" (click)="viewGeneratedCert(row.certificateId, row.studentId)">
                      📜 View & Print Digital Certificate
                    </button>
                  } @else {
                    <button class="btn btn-primary btn-block" (click)="openFinalizeModal(row)">
                      🎓 Finalize Grade & Issue Certificate
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================== -->
      <!-- TAB 4: STUDENT PORTAL VIEW -->
      <!-- ========================================== -->
      @if (activeTab() === 'student-view') {
        <div class="tab-pane">
          <div class="student-portal-header">
            <div class="portal-student-select">
              <label>Select Student Persona:</label>
              <select [(ngModel)]="currentStudentId" (change)="loadStudentPersonaView()" class="form-control">
                @for (s of students(); track s.id) {
                  <option [value]="s.id">{{ s.firstName }} {{ s.lastName }} ({{ s.studentCode }})</option>
                }
              </select>
            </div>
          </div>

          <div class="student-tasks-container">
            <h3>📝 My Active Course Tasks & Online Tests</h3>
            <div class="tasks-list">
              @for (a of assessments(); track a.id) {
                <div class="task-row" [class.task-completed]="a.studentSubmission">
                  <div class="task-info">
                    <span class="type-tag" [ngClass]="getTypeTagClass(a.type)">{{ a.typeName }}</span>
                    <div>
                      <h4>{{ a.title }}</h4>
                      <p class="course-sub">{{ a.courseName }} | Due: {{ formatDueDate(a.dueDate) }}</p>
                    </div>
                  </div>

                  <div class="task-status-area">
                    @if (a.studentSubmission) {
                      <div class="graded-result">
                        @if (a.studentSubmission.score !== null && a.studentSubmission.score !== undefined) {
                          <span class="score-tag">{{ a.studentSubmission.score }} / {{ a.maxScore }} pts ({{ a.studentSubmission.letterGrade }})</span>
                        } @else {
                          <span class="submitted-tag">⏳ Submitted (Pending Grading)</span>
                        }
                        @if (a.studentSubmission.feedback) {
                          <p class="feedback-text">💬 Tutor: "{{ a.studentSubmission.feedback }}"</p>
                        }
                      </div>
                    } @else {
                      @if (a.hasQuestions) {
                        <button class="btn btn-quiz-take btn-sm" (click)="openTakeQuizModal(a)">⏱️ Start Test</button>
                      } @else {
                        <button class="btn btn-submit-hw btn-sm" (click)="openSubmitHwModal(a)">📤 Submit Work</button>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: CREATE ASSESSMENT / TEST -->
      <!-- ========================================== -->
      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ isEditMode() ? '✏️ Edit Assessment & Questions' : '➕ Create Homework, Quiz, or Test' }}</h2>
              <button class="close-btn" (click)="closeModals()">✕</button>
            </div>

            <form (ngSubmit)="submitCreateAssessment()">
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Target Course *</label>
                  <select [(ngModel)]="newAssessment.courseId" name="courseId" required class="form-control">
                    @for (c of courses(); track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Assessment Category *</label>
                  <select [(ngModel)]="newAssessment.type" name="type" required class="form-control">
                    <option [value]="1">📑 Homework Assignment (Written/File)</option>
                    <option [value]="2">⏱️ Interactive Online Quiz (Timed/Auto-Graded)</option>
                    <option [value]="3">📝 Course Test (Midterm/Exam)</option>
                    <option [value]="4">🎓 Final Examination</option>
                    <option [value]="5">💡 Final Capstone Project</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Title *</label>
                <input type="text" [(ngModel)]="newAssessment.title" name="title" required placeholder="e.g. Chapter 4: Calculus Derivatives Quiz" class="form-control" />
              </div>

              <div class="form-group">
                <label>Instructions & Description *</label>
                <textarea [(ngModel)]="newAssessment.description" name="description" rows="3" required placeholder="Detailed problem statement or test instructions..." class="form-control"></textarea>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label>Max Score (Points)</label>
                  <input type="number" [(ngModel)]="newAssessment.maxScore" name="maxScore" min="1" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Grade Weight (%)</label>
                  <input type="number" [(ngModel)]="newAssessment.weightPercentage" name="weightPercentage" min="1" max="100" class="form-control" />
                </div>
                <div class="form-group" *ngIf="+newAssessment.type === 2 || +newAssessment.type === 3 || +newAssessment.type === 4">
                  <label>⏱️ Time Limit (Minutes)</label>
                  <input type="number" [(ngModel)]="newAssessment.durationMinutes" name="durationMinutes" min="1" max="180" class="form-control" placeholder="15" />
                </div>
                <div class="form-group">
                  <label>Due Date</label>
                  <input type="date" [(ngModel)]="newAssessmentDueDateStr" name="dueDate" class="form-control" />
                </div>
              </div>

              <!-- Interactive Quiz Question Builder -->
              @if (+newAssessment.type === 2 || +newAssessment.type === 3 || +newAssessment.type === 4) {
                <div class="quiz-builder-section">
                  <div class="quiz-builder-header">
                    <div>
                      <h4>📝 Interactive Questions & Answer Keys ({{ newQuizQuestions.length }} Questions)</h4>
                      <p class="quiz-builder-sub">Add questions, type the 4 choices, and select the radio button for the correct answer.</p>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline" (click)="addQuizQuestion()">➕ Add Question</button>
                  </div>

                  @for (q of newQuizQuestions; track q.id; let qIdx = $index) {
                    <div class="question-card">
                      <div class="question-card-header">
                        <span>Question #{{ qIdx + 1 }}</span>
                        <button type="button" class="btn-text-danger" (click)="removeQuizQuestion(qIdx)">🗑️ Remove</button>
                      </div>

                      <input type="text" [(ngModel)]="q.question" [name]="'q_text_' + qIdx" placeholder="Enter question prompt..." class="form-control mb-2" required />

                      <div class="options-grid">
                        @for (opt of q.options; track optIdx; let optIdx = $index) {
                          <div class="option-item" [class.option-selected]="q.correctOption === optIdx">
                            <input
                              type="radio"
                              [name]="'q_correct_group_' + qIdx"
                              [value]="optIdx"
                              [(ngModel)]="q.correctOption"
                              id="q_radio_{{ qIdx }}_{{ optIdx }}"
                            />
                            <input
                              type="text"
                              [(ngModel)]="q.options[optIdx]"
                              [name]="'q_opt_' + qIdx + '_' + optIdx"
                              [placeholder]="'Option ' + (optIdx + 1)"
                              class="form-control"
                              required
                            />
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  {{ submitting() ? 'Saving...' : (isEditMode() ? '💾 Save Changes' : 'Publish Assessment') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: TAKE INTERACTIVE QUIZ / TEST -->
      <!-- ========================================== -->
      @if (showQuizModal() && activeQuizAssessment) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header quiz-header">
              <div>
                <h2>⏱️ {{ activeQuizAssessment.title }}</h2>
                <p class="quiz-sub">{{ activeQuizAssessment.courseName }} | {{ activeQuizQuestions.length }} Questions</p>
              </div>
              <div class="timer-badge" [class.timer-urgent]="quizSecondsRemaining() <= 120">
                <span class="timer-icon">⏳</span> {{ formattedQuizTime() }} Time Remaining
              </div>
            </div>

            <div class="quiz-body">
              <p class="quiz-instructions">{{ activeQuizAssessment.description }}</p>

              @for (q of activeQuizQuestions; track q.id; let idx = $index) {
                <div class="student-question-box">
                  <div class="q-number">Question {{ idx + 1 }} of {{ activeQuizQuestions.length }}</div>
                  <h4 class="q-title">{{ q.question }}</h4>

                  <div class="q-options-list">
                    @for (opt of q.options; track optIdx; let optIdx = $index) {
                      <label class="q-option-label" [class.selected]="studentQuizAnswers[q.id.toString()] === optIdx">
                        <input type="radio" [name]="'student_q_' + q.id" [value]="optIdx" [(ngModel)]="studentQuizAnswers[q.id.toString()]" />
                        <span>{{ opt }}</span>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModals()">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="submitQuizAnswers()" [disabled]="submitting()">
                {{ submitting() ? 'Submitting & Evaluating...' : '✅ Submit Test for Instant Auto-Grading' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: SUBMIT WRITTEN HOMEWORK -->
      <!-- ========================================== -->
      @if (showSubmitHwModal() && activeHwAssessment) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>📤 Submit Homework: {{ activeHwAssessment.title }}</h2>
              <button class="close-btn" (click)="closeModals()">✕</button>
            </div>

            <form (ngSubmit)="submitWrittenHomework()">
              <div class="form-group">
                <label>Student Account *</label>
                <select [(ngModel)]="hwSubmissionStudentId" name="studentId" required class="form-control">
                  @for (s of students(); track s.id) {
                    <option [value]="s.id">{{ s.firstName }} {{ s.lastName }} ({{ s.studentCode }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Your Solution / Text Answer *</label>
                <textarea [(ngModel)]="hwSubmissionText" name="submissionText" rows="4" required placeholder="Type your answers or problem derivation steps here..." class="form-control"></textarea>
              </div>

              <div class="form-group">
                <label>Attachment Link / Document URL (Optional)</label>
                <input type="text" [(ngModel)]="hwSubmissionAttachment" name="attachment" placeholder="https://drive.google.com/... or file link" class="form-control" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  {{ submitting() ? 'Submitting...' : 'Submit Homework' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: SUBMISSIONS LIST & TEACHER GRADING -->
      <!-- ========================================== -->
      @if (showSubmissionsModal() && activeAssessmentDetails) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2>📥 Submissions: {{ activeAssessmentDetails.title }}</h2>
                <p class="sub-text">{{ activeAssessmentDetails.courseName }} | Max Points: {{ activeAssessmentDetails.maxScore }}</p>
              </div>
              <button class="close-btn" (click)="closeModals()">✕</button>
            </div>

            <div class="submissions-list-container">
              @if (activeAssessmentDetails.submissions.length === 0) {
                <div class="empty-state-card">
                  <div class="empty-icon">⏳</div>
                  <p>No students have submitted this assignment yet.</p>
                </div>
              } @else {
                <table class="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submission Text</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (sub of activeAssessmentDetails.submissions; track sub.id) {
                      <tr>
                        <td>
                          <strong>{{ sub.studentName }}</strong>
                          <div class="sub-code">{{ sub.studentCode }}</div>
                        </td>
                        <td class="sub-text-cell">{{ sub.submissionText || 'Interactive Test Answers' }}</td>
                        <td>{{ sub.submittedAt }}</td>
                        <td>
                          <span class="status-badge" [class.status-finalized]="sub.status === 2">
                            {{ sub.statusName }}
                          </span>
                        </td>
                        <td><strong>{{ sub.score !== null ? sub.score : '-' }}</strong> / {{ activeAssessmentDetails.maxScore }}</td>
                        <td><span class="letter-badge">{{ sub.letterGrade || '-' }}</span></td>
                        <td>
                          <button class="btn btn-sm btn-outline" (click)="openGradeDialog(sub)">
                            ✏️ Grade
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: GRADE SINGLE SUBMISSION -->
      <!-- ========================================== -->
      @if (showGradeDialog() && activeSubmissionToGrade) {
        <div class="modal-backdrop" (click)="showGradeDialog.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>✏️ Grade Submission: {{ activeSubmissionToGrade.studentName }}</h2>
              <button class="close-btn" (click)="showGradeDialog.set(false)">✕</button>
            </div>

            <form (ngSubmit)="submitGrade()">
              <div class="form-group">
                <label>Score (Points out of {{ activeAssessmentDetails?.maxScore || 100 }}) *</label>
                <input type="number" [(ngModel)]="gradeFormScore" name="score" min="0" [max]="activeAssessmentDetails?.maxScore || 100" required class="form-control" />
              </div>

              <div class="form-group">
                <label>Letter Grade (Optional - Auto calculated if blank)</label>
                <select [(ngModel)]="gradeFormLetter" name="letterGrade" class="form-control">
                  <option value="">Auto (Calculate from score)</option>
                  <option value="A+">A+ (95-100%)</option>
                  <option value="A">A (90-94%)</option>
                  <option value="B+">B+ (85-89%)</option>
                  <option value="B">B (80-84%)</option>
                  <option value="C+">C+ (75-79%)</option>
                  <option value="C">C (70-74%)</option>
                  <option value="D">D (60-69%)</option>
                  <option value="F">F (&lt;60%)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Feedback & Comments</label>
                <textarea [(ngModel)]="gradeFormFeedback" name="feedback" rows="3" placeholder="Praise, corrections, or areas to improve..." class="form-control"></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showGradeDialog.set(false)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  {{ submitting() ? 'Saving Grade...' : 'Save Grade & Feedback' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: FINALIZE COURSE GRADE & CERTIFICATE -->
      <!-- ========================================== -->
      @if (showFinalizeModal() && activeStudentToFinalize) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>🎓 Finalize Course Grade: {{ activeStudentToFinalize.studentName }}</h2>
              <button class="close-btn" (click)="closeModals()">✕</button>
            </div>

            <form (ngSubmit)="submitFinalizeGrade()">
              <div class="finalize-summary-card">
                <div class="row-flex">
                  <span>Calculated Cumulative Score:</span>
                  <strong>{{ activeStudentToFinalize.cumulativeScore }}%</strong>
                </div>
                <div class="row-flex">
                  <span>Homework Average (30%):</span>
                  <span>{{ activeStudentToFinalize.hwAverage }}%</span>
                </div>
                <div class="row-flex">
                  <span>Quiz Average (30%):</span>
                  <span>{{ activeStudentToFinalize.quizAverage }}%</span>
                </div>
                <div class="row-flex">
                  <span>Test Average (40%):</span>
                  <span>{{ activeStudentToFinalize.testAverage }}%</span>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label>Official Letter Grade</label>
                  <select [(ngModel)]="finalizeLetter" name="finalizeLetter" class="form-control">
                    <option value="A+">A+ (Exceptional Mastery)</option>
                    <option value="A">A (Superior Achievement)</option>
                    <option value="B+">B+ (High Distinction)</option>
                    <option value="B">B (Above Average)</option>
                    <option value="C">C (Satisfactory)</option>
                    <option value="D">D (Minimum Pass)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Certificate Honors Tier</label>
                  <select [(ngModel)]="finalizeHonors" name="finalizeHonors" class="form-control">
                    <option value="High Distinction (Honors)">🥇 High Distinction (Honors)</option>
                    <option value="Merit">🥈 Merit</option>
                    <option value="Pass">🥉 Standard Pass</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Teacher Conduct & Final Remarks</label>
                <textarea [(ngModel)]="finalizeRemarks" name="finalizeRemarks" rows="3" placeholder="Remark will be printed on their official Digital Certificate..." class="form-control"></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  {{ submitting() ? 'Issuing Certificate...' : '🔒 Confirm Final Grade & Issue Certificate' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================== -->
      <!-- MODAL: OFFICIAL DIGITAL CERTIFICATE VIEWER -->
      <!-- ========================================== -->
      @if (showCertModal() && activeCertificate()) {
        <div class="modal-backdrop cert-backdrop" (click)="closeModals()">
          <div class="modal-content cert-modal-dialog" (click)="$event.stopPropagation()">
            <div class="cert-dialog-header no-print">
              <div class="cert-status-tag">📜 Official Verified Digital Certificate</div>
              <div class="cert-btn-group">
                <button type="button" class="btn btn-download-pdf" (click)="downloadCertificatePdf()">📥 Download PDF</button>
                <button type="button" class="btn btn-print" (click)="printCertificate()">🖨️ Print Certificate</button>
                <button class="close-btn" (click)="closeModals()">✕</button>
              </div>
            </div>

            <div class="diploma-outer-frame" id="printableCertificate">
              <div class="diploma-inner-frame">
                <div class="diploma-watermark-bg"></div>

                <!-- Header -->
                <div class="diploma-top">
                  <div class="diploma-crown">🎓</div>
                  <h2 class="diploma-school">BRIGHT TUTORIAL CENTER</h2>
                  <p class="diploma-motto">Official Certificate of Academic Completion & Excellence</p>
                  <div class="diploma-ribbon">OFFICIAL DIPLOMA OF ACADEMIC ACHIEVEMENT</div>
                </div>

                <!-- Body -->
                <div class="diploma-core">
                  <p class="confer-text">This official credential is proudly awarded to</p>
                  <h1 class="confer-name">{{ activeCertificate()?.recipientName }}</h1>
                  <p class="confer-desc">{{ activeCertificate()?.description }}</p>

                  <div class="diploma-pills-row">
                    <div class="dpill">
                      <span class="dpill-label">COURSE</span>
                      <span class="dpill-val">{{ activeCertificate()?.skillsLearned }}</span>
                    </div>
                    <div class="dpill">
                      <span class="dpill-label">TIMELINE</span>
                      <span class="dpill-val">{{ activeCertificate()?.timelineDuration || '12 Weeks' }}</span>
                    </div>
                    <div class="dpill">
                      <span class="dpill-label">ACADEMIC STANDING</span>
                      <span class="dpill-val">Verified & Issued</span>
                    </div>
                  </div>
                </div>

                <!-- Footer with Signatures and Gold Seal -->
                <div class="diploma-bottom">
                  <div class="sig-column">
                    <div class="sig-script">Munir Nesru</div>
                    <div class="sig-rule"></div>
                    <div class="sig-auth">Munir Nesru</div>
                    <div class="sig-role">Academic Board Director</div>
                  </div>

                  <div class="seal-column">
                    <div class="gold-seal-badge">
                      <div class="seal-star-gold">★ ★ ★</div>
                      <div class="seal-title-gold">BRIGHT TUTOR</div>
                      <div class="seal-sub-gold">SEAL OF EXCELLENCE</div>
                    </div>
                    <div class="seal-serial-text">Serial: {{ activeCertificate()?.serialNumber }}</div>
                    <div class="seal-date-text">Issued: {{ activeCertificate()?.issueDate | date:'longDate' }}</div>
                  </div>

                  <div class="sig-column">
                    <div class="sig-script">Rihana Jemal</div>
                    <div class="sig-rule"></div>
                    <div class="sig-auth">Rihana Jemal</div>
                    <div class="sig-role">Education Director</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .assessments-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;

      .header-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        .header-icon-box {
          font-size: 2.2rem;
          background: linear-gradient(135deg, #0B3D2E, #10B981);
          color: white;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text, #0B241B);
          margin: 0;
        }

        .page-subtitle {
          color: var(--color-muted, #5C786A);
          font-size: 0.88rem;
          margin: 0.25rem 0 0 0;
        }
      }
    }

    /* Tabs */
    .nav-tabs-container {
      margin-bottom: 1.5rem;
      border-bottom: 1.5px solid var(--color-border, #DCE8E1);

      .nav-tabs {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: none;
          background: transparent;
          font-weight: 700;
          font-size: 0.92rem;
          color: var(--color-muted, #5C786A);
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            color: var(--color-accent-bright, #10B981);
          }

          &.active {
            color: var(--color-accent-dark, #0B3D2E);
            border-bottom-color: var(--color-accent-bright, #10B981);
          }

          .tab-badge {
            background: #E2E8F0;
            color: #475569;
            font-size: 0.75rem;
            padding: 0.15rem 0.5rem;
            border-radius: 10px;
          }
        }
      }
    }

    /* Filters Card */
    .filters-card {
      background: white;
      border: 1px solid var(--color-border, #DCE8E1);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      gap: 1.5rem;
      align-items: center;
      flex-wrap: wrap;

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-muted, #5C786A);
        }
      }

      .type-pill-group {
        display: flex;
        gap: 0.4rem;

        .type-pill {
          padding: 0.4rem 0.85rem;
          border-radius: 20px;
          border: 1px solid var(--color-border, #DCE8E1);
          background: white;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;

          &.active {
            background: var(--color-accent-dark, #0B3D2E);
            color: white;
            border-color: var(--color-accent-dark, #0B3D2E);
          }
        }
      }
    }

    /* Assessments Grid */
    .assessments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .assessment-card {
      background: white;
      border-radius: 14px;
      border: 1.5px solid var(--color-border, #DCE8E1);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;

        .type-tag {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }

        .header-right-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;

          .weight-badge {
            font-size: 0.78rem;
            font-weight: 700;
            color: #64748B;
          }

          .btn-card-edit, .btn-card-delete {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0.15rem 0.35rem;
            border-radius: 4px;
            font-size: 0.85rem;
            opacity: 0.65;
            transition: all 0.2s;

            &:hover {
              opacity: 1;
              background: #F1F5F9;
              transform: scale(1.1);
            }
          }
        }
      }

      .assessment-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: var(--color-text, #0B241B);
        margin: 0 0 0.25rem 0;
      }

      .assessment-course {
        font-size: 0.82rem;
        color: var(--color-muted, #5C786A);
        margin: 0 0 0.5rem 0;
        font-weight: 600;
      }

      .assessment-desc {
        font-size: 0.85rem;
        color: #475569;
        margin: 0 0 1rem 0;
        line-height: 1.4;
        flex-grow: 1;
      }

      .assessment-meta {
        background: #F8FAFC;
        border-radius: 8px;
        padding: 0.65rem 0.85rem;
        margin-bottom: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;

        .meta-item {
          display: flex;
          flex-direction: column;
          font-size: 0.78rem;

          .meta-label { color: #64748B; }
          .meta-value { font-weight: 700; color: #1E293B; }
          .due-date { color: #D97706; }
        }
      }

      .card-footer {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;

        button {
          flex: 1;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 0.55rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-quiz-take {
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          color: white;
          border: none;
        }

        .btn-submit-hw {
          background: linear-gradient(135deg, #0B3D2E, #059669);
          color: white;
          border: none;
        }

        .btn-edit-action {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #BFDBFE;

          &:hover {
            background: #DBEAFE;
          }
        }

        .btn-review {
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #CBD5E1;
        }
      }
    }

    /* Tag styles */
    .tag-hw { background: #E0F2FE; color: #0284C7; }
    .tag-quiz { background: #F3E8FF; color: #9333EA; }
    .tag-test { background: #FEF3C7; color: #D97706; }
    .tag-exam { background: #FEE2E2; color: #DC2626; }

    /* Master Gradebook Table */
    .gradebook-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      background: white;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      border: 1px solid var(--color-border, #DCE8E1);
      flex-wrap: wrap;
      gap: 1rem;

      .control-select {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        label { font-weight: 700; font-size: 0.9rem; }
        .course-selector { min-width: 250px; }
      }

      .gradebook-legend {
        display: flex;
        gap: 1rem;
        font-size: 0.82rem;
        font-weight: 600;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
          }
          .dot-hw { background: #0284C7; }
          .dot-quiz { background: #9333EA; }
          .dot-test { background: #D97706; }
        }
      }
    }

    .gradebook-table-container {
      background: white;
      border-radius: 12px;
      border: 1px solid var(--color-border, #DCE8E1);
      overflow-x: auto;
    }

    .gradebook-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;

      th {
        background: #F8FAFC;
        padding: 0.85rem 1rem;
        font-weight: 800;
        color: #475569;
        text-align: left;
        border-bottom: 1.5px solid #E2E8F0;
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #F1F5F9;
        vertical-align: middle;
      }

      .student-cell {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .student-thumb {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .student-avatar-fallback {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .student-name { font-weight: 700; color: #1E293B; }
      }

      .code-badge {
        background: #F1F5F9;
        color: #475569;
        padding: 0.2rem 0.45rem;
        border-radius: 4px;
        font-size: 0.78rem;
        font-weight: 700;
      }

      .score-cell { font-weight: 700; }
      .hw-score { color: #0284C7; }
      .quiz-score { color: #9333EA; }
      .test-score { color: #D97706; }
      .total-score { font-size: 1rem; color: #0B3D2E; }

      .letter-badge {
        display: inline-block;
        font-weight: 800;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        font-size: 0.85rem;
      }

      .grade-a { background: #DCFCE7; color: #16A34A; }
      .grade-b { background: #E0F2FE; color: #0284C7; }
      .grade-c { background: #FEF3C7; color: #D97706; }
      .grade-d { background: #FEE2E2; color: #DC2626; }

      .honors-tag {
        font-size: 0.8rem;
        font-weight: 700;
        color: #475569;
      }

      .status-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.2rem 0.5rem;
        border-radius: 10px;
      }
      .status-finalized { background: #DCFCE7; color: #16A34A; }
      .status-active { background: #FEF3C7; color: #D97706; }

      .btn-finalize {
        background: linear-gradient(135deg, #0B3D2E, #059669);
        color: white;
        border: none;
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
      }
    }

    /* Final Course Grading Cards */
    .final-grading-banner {
      background: linear-gradient(135deg, #0B3D2E, #10B981);
      color: white;
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;

      .banner-icon { font-size: 3rem; }
      h2 { margin: 0; font-size: 1.4rem; font-weight: 800; }
      p { margin: 0.35rem 0 0 0; opacity: 0.9; font-size: 0.92rem; }
    }

    .final-grading-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      background: white;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      border: 1px solid var(--color-border, #DCE8E1);
      flex-wrap: wrap;
      gap: 1rem;

      .selector-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        label {
          font-weight: 700;
          color: #1E293B;
          font-size: 0.9rem;
        }

        .course-select {
          min-width: 280px;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-weight: 600;
        }
      }

      .summary-stats-pills {
        display: flex;
        gap: 0.75rem;

        .stat-pill {
          background: #F1F5F9;
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          font-size: 0.82rem;
          color: #475569;

          strong { color: #0F172A; }

          &.stat-issued {
            background: #DCFCE7;
            color: #15803D;
            strong { color: #166534; }
          }
        }
      }
    }

    .final-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }

    .final-student-card {
      background: white;
      border-radius: 14px;
      border: 1.5px solid var(--color-border, #DCE8E1);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      &.card-finalized {
        border-color: #10B981;
        background: #F4FAF6;
      }

      .card-top {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        .final-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #10B981;
        }

        .final-avatar-fallback {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0B241B; }
      }

      .score-breakdown-box {
        background: white;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.85rem;

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          color: #475569;
        }

        .breakdown-total {
          border-top: 1px dashed #CBD5E1;
          padding-top: 0.5rem;
          margin-top: 0.25rem;
          display: flex;
          justify-content: space-between;
          font-weight: 800;

          .total-percent { color: #0B3D2E; font-size: 1rem; }
        }
      }

      .honors-award-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.88rem;
        font-weight: 700;
        color: #1E293B;
      }

      .cert-issued-alert {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        background: #DCFCE7;
        padding: 0.75rem;
        border-radius: 8px;
        color: #16A34A;
        font-size: 0.85rem;

        p { margin: 0.15rem 0 0 0; color: #15803D; font-size: 0.8rem; }
      }

      .btn-view-cert {
        display: block;
        text-align: center;
        background: #0B3D2E;
        color: white;
        padding: 0.65rem;
        border-radius: 8px;
        font-weight: 700;
        text-decoration: none;
      }
    }

    /* Student Portal Tasks */
    .student-portal-header {
      background: white;
      border: 1px solid var(--color-border, #DCE8E1);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;

      .portal-student-select {
        display: flex;
        align-items: center;
        gap: 1rem;
        label { font-weight: 700; }
        select { max-width: 320px; }
      }
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;

      .task-row {
        background: white;
        border: 1px solid var(--color-border, #DCE8E1);
        border-radius: 10px;
        padding: 1rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;

        &.task-completed {
          background: #F8FAFC;
        }

        .task-info {
          display: flex;
          align-items: center;
          gap: 1rem;

          h4 { margin: 0 0 0.2rem 0; font-size: 1rem; font-weight: 700; color: #0B241B; }
          .course-sub { margin: 0; font-size: 0.8rem; color: #64748B; }
        }

        .task-status-area {
          .score-tag {
            font-weight: 800;
            color: #16A34A;
            background: #DCFCE7;
            padding: 0.3rem 0.65rem;
            border-radius: 6px;
            font-size: 0.85rem;
          }

          .submitted-tag {
            font-weight: 700;
            color: #D97706;
            background: #FEF3C7;
            padding: 0.3rem 0.65rem;
            border-radius: 6px;
            font-size: 0.85rem;
          }

          .feedback-text {
            font-size: 0.8rem;
            color: #475569;
            margin: 0.35rem 0 0 0;
            font-style: italic;
          }
        }
      }
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 1.75rem;
      width: 100%;
      max-width: 550px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);

      &.modal-lg { max-width: 750px; }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;

        h2 { font-size: 1.25rem; font-weight: 800; margin: 0; }
        .close-btn { background: none; border: none; font-size: 1.25rem; cursor: pointer; }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
    }

    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }

    .form-group {
      margin-bottom: 1rem;
      label { display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: #334155; }
    }

    .form-control {
      width: 100%;
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      border: 1.5px solid #CBD5E1;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;

      &:focus { border-color: #10B981; }
    }

    .btn {
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0B3D2E, #10B981);
      color: white;
      &:hover { opacity: 0.95; }
    }

    .btn-secondary { background: #E2E8F0; color: #475569; }
    .btn-outline { background: white; border: 1.5px solid #CBD5E1; color: #334155; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .btn-block { width: 100%; }

    /* Quiz Builder */
    .quiz-builder-section {
      background: #F8FAFC;
      border: 1.5px dashed #CBD5E1;
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 1rem;

      .quiz-builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        h4 { margin: 0; font-size: 0.95rem; font-weight: 800; }
      }

      .question-card {
        background: white;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.85rem;

        .question-card-header {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.82rem;
          color: #64748B;
          margin-bottom: 0.5rem;
        }

        .btn-text-danger { background: none; border: none; color: #EF4444; cursor: pointer; }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;

          .option-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }
        }
      }
    }

    /* Interactive Quiz Taking Modal */
    .quiz-header {
      .quiz-sub { margin: 0.25rem 0 0 0; color: #64748B; font-size: 0.85rem; }
      .timer-badge {
        background: #FEF3C7;
        color: #D97706;
        font-weight: 800;
        padding: 0.4rem 0.85rem;
        border-radius: 20px;
        font-size: 0.85rem;
      }
    }

    .student-question-box {
      background: #F8FAFC;
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1rem;

      .q-number { font-size: 0.78rem; font-weight: 700; color: #64748B; }
      .q-title { font-size: 1.05rem; font-weight: 700; margin: 0.35rem 0 0.85rem 0; }

      .q-options-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .q-option-label {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 1rem;
          background: white;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;

          &.selected {
            border-color: #4F46E5;
            background: #EEF2FF;
            color: #4338CA;
          }
        }
      }
    }

    /* Finalize Summary Card */
    .finalize-summary-card {
      background: #F0FDF4;
      border: 1.5px solid #BBF7D0;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1.25rem;

      .row-flex {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.35rem;
        font-size: 0.88rem;
        color: #166534;
      }
    }

    .loading-state, .empty-state-card {
      text-align: center;
      padding: 3rem 1.5rem;
      background: white;
      border-radius: 14px;
      border: 1.5px solid var(--color-border, #DCE8E1);

      .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
      h3 { margin: 0 0 0.5rem 0; font-size: 1.2rem; font-weight: 800; }
      p { color: #64748B; margin-bottom: 1rem; }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #E2E8F0;
      border-top-color: #10B981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem auto;
    }

    /* Official Digital Certificate Modal */
    .cert-backdrop {
      z-index: 1200;
      background: rgba(11, 36, 27, 0.85);
      backdrop-filter: blur(8px);
    }

    .cert-modal-dialog {
      max-width: 950px;
      width: 95vw;
      background: transparent;
      box-shadow: none;
      border: none;
      padding: 0;
    }

    .cert-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0B241B;
      padding: 0.75rem 1.25rem;
      border-radius: 12px 12px 0 0;
      color: white;

      .cert-status-tag {
        font-weight: 800;
        font-size: 0.95rem;
        color: #FDE047;
      }

      .cert-btn-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .btn-download-pdf {
          background: linear-gradient(135deg, #D4AF37, #B8860B);
          color: #0B241B;
          border: 1px solid #FFF5B8;
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
          transition: all 0.2s;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.6);
          }
        }

        .btn-print {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .close-btn {
          color: white;
          font-size: 1.2rem;
          background: none;
          border: none;
          cursor: pointer;
        }
      }
    }

    .diploma-outer-frame {
      background: #FDFBF7;
      padding: 1.5rem;
      border: 12px solid #0B3D2E;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
    }

    .diploma-inner-frame {
      border: 3px solid #D4AF37;
      padding: 2rem;
      background: #FFFEFA;
      text-align: center;
      position: relative;
    }

    .diploma-top {
      margin-bottom: 1.5rem;
      .diploma-crown { font-size: 2.5rem; margin-bottom: 0.25rem; }
      .diploma-school { font-size: 1.8rem; font-weight: 900; letter-spacing: 2px; color: #0B3D2E; margin: 0; font-family: serif; }
      .diploma-motto { font-size: 0.85rem; color: #856404; letter-spacing: 1px; margin: 0.25rem 0 0.75rem 0; font-style: italic; }
      .diploma-ribbon {
        display: inline-block;
        background: #0B3D2E;
        color: #FDFBF7;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 1.5px;
        padding: 0.35rem 1.25rem;
        border-radius: 20px;
        border: 1px solid #D4AF37;
      }
    }

    .diploma-core {
      margin-bottom: 2rem;
      .confer-text { font-size: 0.95rem; color: #4B5563; font-style: italic; margin: 0 0 0.5rem 0; }
      .confer-name {
        font-size: 2.4rem;
        font-weight: 900;
        color: #0B241B;
        font-family: serif;
        margin: 0.25rem 0 0.75rem 0;
        border-bottom: 2px solid #E5E7EB;
        display: inline-block;
        padding-bottom: 0.25rem;
      }
      .confer-desc {
        max-width: 680px;
        margin: 0 auto 1.5rem auto;
        font-size: 0.95rem;
        color: #374151;
        line-height: 1.5;
      }

      .diploma-pills-row {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;

        .dpill {
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 140px;

          .dpill-label { font-size: 0.7rem; font-weight: 800; color: #6B7280; letter-spacing: 0.5px; }
          .dpill-val { font-size: 0.85rem; font-weight: 800; color: #111827; }
        }
      }
    }

    .diploma-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 1.5rem;
      border-top: 1px solid #E5E7EB;

      .sig-column {
        text-align: center;
        width: 180px;

        .sig-script {
          font-family: 'Brush Script MT', cursive, serif;
          font-size: 1.6rem;
          color: #1E3A8A;
          margin-bottom: 0.25rem;
        }
        .sig-rule { height: 1.5px; background: #9CA3AF; margin-bottom: 0.35rem; }
        .sig-auth { font-weight: 800; font-size: 0.85rem; color: #1F2937; }
        .sig-role { font-size: 0.75rem; color: #6B7280; }
      }

      .seal-column {
        text-align: center;

        .gold-seal-badge {
          width: 90px;
          height: 90px;
          margin: 0 auto 0.5rem auto;
          background: radial-gradient(circle, #FDE047, #CA8A04);
          border: 3px double #78350F;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(202, 138, 4, 0.3);

          .seal-star-gold { font-size: 0.7rem; color: #78350F; }
          .seal-title-gold { font-size: 0.65rem; font-weight: 900; color: #78350F; letter-spacing: 0.5px; }
          .seal-sub-gold { font-size: 0.5rem; font-weight: 800; color: #78350F; }
        }

        .seal-serial-text { font-size: 0.75rem; font-weight: 700; color: #4B5563; font-family: monospace; }
        .seal-date-text { font-size: 0.72rem; color: #6B7280; }
      }
    }

    @media print {
      @page {
        size: landscape;
        margin: 0.5cm;
      }
      body {
        margin: 0;
        padding: 0;
        background: white !important;
      }
      body * {
        visibility: hidden;
      }
      #printableCertificate, #printableCertificate * {
        visibility: visible;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #printableCertificate {
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        max-width: 100%;
        margin: 0;
        border: 10px solid #0B3D2E !important;
        background: #FDFBF7 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-inside: avoid;
      }
      .no-print {
        display: none !important;
      }
      .cert-backdrop {
        background: none !important;
        position: static !important;
      }
      .cert-modal-dialog {
        max-width: 100% !important;
        width: 100% !important;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AssessmentsComponent implements OnInit, OnDestroy {
  private assessmentService = inject(AssessmentService);
  private courseService = inject(CourseService);
  private studentService = inject(StudentService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);
  private certificateService = inject(CertificateService);

  // Active Tab
  activeTab = signal<'assessments' | 'gradebook' | 'final-grading' | 'student-view'>('assessments');

  // Dynamic Quiz Countdown Timer
  quizSecondsRemaining = signal<number>(15 * 60);
  quizTimer: any = null;
  formattedQuizTime = computed(() => {
    const total = this.quizSecondsRemaining();
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  // Data
  assessments = signal<AssessmentDto[]>([]);
  courses = signal<any[]>([]);
  students = signal<StudentDto[]>([]);
  gradebookData = signal<MasterGradebookResponse | null>(null);
  finalGradingData = signal<MasterGradebookResponse | null>(null);

  // Filters
  filterCourseId = '';
  filterType: number | null = null;
  selectedGradebookCourseId = '';
  selectedFinalGradingCourseId = '';
  currentStudentId = '';

  // Loading flags
  loading = signal<boolean>(false);
  gradebookLoading = signal<boolean>(false);
  finalGradingLoading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  // Modals state
  showCreateModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingAssessmentId: string | null = null;
  showQuizModal = signal<boolean>(false);
  showSubmitHwModal = signal<boolean>(false);
  showSubmissionsModal = signal<boolean>(false);
  showGradeDialog = signal<boolean>(false);
  showFinalizeModal = signal<boolean>(false);
  showCertModal = signal<boolean>(false);
  activeCertificate = signal<CertificateDto | null>(null);

  // Create Assessment Form
  newAssessment = {
    courseId: '',
    type: 1,
    title: '',
    description: '',
    maxScore: 100,
    weightPercentage: 25,
    durationMinutes: 15,
    teacherId: ''
  };
  newAssessmentDueDateStr = '';
  newQuizQuestions: QuizQuestion[] = [];

  // Active Context for Modals
  activeQuizAssessment: AssessmentDto | null = null;
  activeQuizQuestions: QuizQuestion[] = [];
  studentQuizAnswers: { [key: string]: number } = {};

  activeHwAssessment: AssessmentDto | null = null;
  hwSubmissionStudentId = '';
  hwSubmissionText = '';
  hwSubmissionAttachment = '';

  activeAssessmentDetails: any = null;
  activeSubmissionToGrade: any = null;
  gradeFormScore: number = 0;
  gradeFormLetter: string = '';
  gradeFormFeedback: string = '';

  activeStudentToFinalize: MasterGradebookRow | null = null;
  finalizeLetter: string = 'A';
  finalizeHonors: string = 'High Distinction (Honors)';
  finalizeRemarks: string = 'Demonstrated outstanding course mastery and problem-solving excellence.';

  ngOnInit(): void {
    if (this.authService.isStudent()) {
      this.activeTab.set('student-view');
    }
    this.loadCourses();
    this.loadStudents();
    this.loadAssessments();
  }

  setTab(tab: 'assessments' | 'gradebook' | 'final-grading' | 'student-view'): void {
    this.activeTab.set(tab);
    if (tab === 'gradebook') {
      if (!this.selectedGradebookCourseId && this.courses().length > 0) {
        this.selectedGradebookCourseId = this.courses()[0].id;
      }
      this.loadMasterGradebook();
    } else if (tab === 'final-grading') {
      if (!this.selectedFinalGradingCourseId && this.courses().length > 0) {
        this.selectedFinalGradingCourseId = this.courses()[0].id;
      }
      this.onFinalGradingCourseChange();
    }
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses.set(res);
        if (res.length > 0) {
          if (!this.selectedGradebookCourseId) {
            this.selectedGradebookCourseId = res[0].id;
          }
          if (!this.selectedFinalGradingCourseId) {
            this.selectedFinalGradingCourseId = res[0].id;
            this.onFinalGradingCourseChange();
          }
          this.newAssessment.courseId = res[0].id;
        }
      }
    });
  }

  onFinalGradingCourseChange(): void {
    if (!this.selectedFinalGradingCourseId) {
      this.finalGradingData.set(null);
      return;
    }
    this.finalGradingLoading.set(true);
    this.assessmentService.getMasterGradebook(this.selectedFinalGradingCourseId).subscribe({
      next: (res) => {
        this.finalGradingData.set(res);
        this.finalGradingLoading.set(false);
      },
      error: () => {
        this.finalGradingLoading.set(false);
        this.toastService.show('Failed to load final course grading data.', 'error');
      }
    });
  }

  getIssuedCertsCount(): number {
    return this.finalGradingData()?.students?.filter(s => s.isFinalized).length || 0;
  }

  loadStudents(): void {
    this.studentService.getStudents().subscribe({
      next: (res) => {
        this.students.set(res);
        if (res.length > 0) {
          this.currentStudentId = res[0].id;
          this.hwSubmissionStudentId = res[0].id;
        }
      }
    });
  }

  loadAssessments(): void {
    this.loading.set(true);
    this.assessmentService.getAssessments(
      this.filterCourseId || undefined,
      undefined,
      this.filterType ?? undefined,
      this.currentStudentId || undefined
    ).subscribe({
      next: (res) => {
        this.assessments.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilterType(type: number | null): void {
    this.filterType = type;
    this.loadAssessments();
  }

  loadMasterGradebook(): void {
    if (!this.selectedGradebookCourseId) return;
    this.gradebookLoading.set(true);
    this.assessmentService.getMasterGradebook(this.selectedGradebookCourseId).subscribe({
      next: (res) => {
        this.gradebookData.set(res);
        this.gradebookLoading.set(false);
      },
      error: () => this.gradebookLoading.set(false)
    });
  }

  loadStudentPersonaView(): void {
    this.loadAssessments();
  }

  // Modals & Handlers
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingAssessmentId = null;
    this.newAssessment = {
      courseId: this.courses().length > 0 ? this.courses()[0].id : '',
      type: 2,
      title: '',
      description: '',
      maxScore: 100,
      weightPercentage: 30,
      durationMinutes: 15,
      teacherId: this.authService.currentUser()?.userId || ''
    };
    this.newAssessmentDueDateStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    this.newQuizQuestions = [
      { id: 1, question: 'What is the fundamental derivative rule of f(x) = x^n?', options: ['n * x^(n-1)', 'x^n / n', 'n * x^n', 'x^(n+1)'], correctOption: 0, points: 10 },
      { id: 2, question: 'Which law relates force to mass and acceleration?', options: ['Newton 1st', 'Newton 2nd (F=ma)', 'Newton 3rd', 'Hooke Law'], correctOption: 1, points: 10 }
    ];
    this.showCreateModal.set(true);
  }

  openEditModal(a: AssessmentDto): void {
    this.isEditMode.set(true);
    this.editingAssessmentId = a.id;
    this.newAssessment = {
      courseId: a.courseId,
      type: a.type,
      title: a.title,
      description: a.description,
      maxScore: a.maxScore,
      weightPercentage: a.weightPercentage,
      durationMinutes: a.durationMinutes || 15,
      teacherId: a.teacherId || this.authService.currentUser()?.userId || ''
    };
    this.newAssessmentDueDateStr = a.dueDate ? a.dueDate.split('T')[0] : '';
    if (a.questionsJson) {
      try {
        this.newQuizQuestions = JSON.parse(a.questionsJson);
      } catch {
        this.newQuizQuestions = [];
      }
    } else {
      this.newQuizQuestions = [
        { id: 1, question: '', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, points: 10 }
      ];
    }
    this.showCreateModal.set(true);
  }

  addQuizQuestion(): void {
    const id = this.newQuizQuestions.length + 1;
    this.newQuizQuestions.push({
      id,
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOption: 0,
      points: 10
    });
  }

  removeQuizQuestion(index: number): void {
    this.newQuizQuestions.splice(index, 1);
  }

  submitCreateAssessment(): void {
    if (!this.newAssessment.title || !this.newAssessment.courseId) {
      this.toastService.show('Please fill in title and course.', 'error');
      return;
    }

    let questionsJson: string | undefined = undefined;
    if (+this.newAssessment.type === 2 || +this.newAssessment.type === 3 || +this.newAssessment.type === 4) {
      questionsJson = JSON.stringify(this.newQuizQuestions);
    }

    const payload = {
      ...this.newAssessment,
      dueDate: this.newAssessmentDueDateStr ? new Date(this.newAssessmentDueDateStr).toISOString() : undefined,
      questionsJson
    };

    this.submitting.set(true);

    if (this.isEditMode() && this.editingAssessmentId) {
      this.assessmentService.updateAssessment(this.editingAssessmentId, payload).subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.toastService.show(res.message || 'Assessment updated successfully!', 'success');
          this.closeModals();
          this.loadAssessments();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toastService.show(err.error?.message || 'Failed to update assessment.', 'error');
        }
      });
    } else {
      this.assessmentService.createAssessment(payload).subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.toastService.show(res.message || 'Assessment created successfully!', 'success');
          this.closeModals();
          this.loadAssessments();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toastService.show(err.error?.message || 'Failed to create assessment.', 'error');
        }
      });
    }
  }

  deleteAssessment(id: string): void {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    this.assessmentService.deleteAssessment(id).subscribe({
      next: () => {
        this.toastService.show('Assessment deleted successfully.', 'success');
        this.loadAssessments();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to delete assessment.', 'error');
      }
    });
  }

  // Quiz Handling
  openTakeQuizModal(a: AssessmentDto): void {
    this.activeQuizAssessment = a;
    this.studentQuizAnswers = {};
    if (a.questionsJson) {
      try {
        this.activeQuizQuestions = JSON.parse(a.questionsJson);
      } catch {
        this.activeQuizQuestions = [];
      }
    } else {
      this.activeQuizQuestions = [
        { id: 1, question: 'Identify the primary theorem application:', options: ['Method A', 'Method B', 'Method C', 'Method D'], correctOption: 0, points: 50 },
        { id: 2, question: 'Calculate the expected convergence limit:', options: ['0.0', '1.0', 'Infinity', 'Undefined'], correctOption: 1, points: 50 }
      ];
    }

    // Start live dynamic countdown timer based on customized DurationMinutes
    const durationMins = (a.durationMinutes && a.durationMinutes > 0) ? a.durationMinutes : 15;
    this.quizSecondsRemaining.set(durationMins * 60);
    if (this.quizTimer) clearInterval(this.quizTimer);
    this.quizTimer = setInterval(() => {
      if (this.quizSecondsRemaining() > 0) {
        this.quizSecondsRemaining.update(v => v - 1);
      } else {
        clearInterval(this.quizTimer);
        this.quizTimer = null;
        this.toastService.show('⏳ Time is up! Submitting test automatically...', 'info');
        this.submitQuizAnswers();
      }
    }, 1000);

    this.showQuizModal.set(true);
  }

  submitQuizAnswers(): void {
    if (!this.activeQuizAssessment) return;

    const studentId = this.currentStudentId || (this.students().length > 0 ? this.students()[0].id : '');
    if (!studentId) {
      this.toastService.show('No student selected.', 'error');
      return;
    }

    const payload = {
      studentId,
      answersJson: JSON.stringify(this.studentQuizAnswers)
    };

    this.submitting.set(true);
    this.assessmentService.submitAssessment(this.activeQuizAssessment.id, payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toastService.show(res.message || `Test graded! Score: ${res.score} (${res.letterGrade})`, 'success');
        this.closeModals();
        this.loadAssessments();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show(err.error?.message || 'Failed to submit quiz.', 'error');
      }
    });
  }

  // Written Homework Handling
  openSubmitHwModal(a: AssessmentDto): void {
    this.activeHwAssessment = a;
    this.hwSubmissionText = '';
    this.hwSubmissionAttachment = '';
    this.showSubmitHwModal.set(true);
  }

  submitWrittenHomework(): void {
    if (!this.activeHwAssessment || !this.hwSubmissionText) {
      this.toastService.show('Please provide your solution text.', 'error');
      return;
    }

    const payload = {
      studentId: this.hwSubmissionStudentId,
      submissionText: this.hwSubmissionText,
      attachmentUrl: this.hwSubmissionAttachment
    };

    this.submitting.set(true);
    this.assessmentService.submitAssessment(this.activeHwAssessment.id, payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toastService.show(res.message || 'Homework submitted for tutor review!', 'success');
        this.closeModals();
        this.loadAssessments();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show(err.error?.message || 'Submission failed.', 'error');
      }
    });
  }

  // Submissions & Grading List
  openSubmissionsModal(a: AssessmentDto): void {
    this.assessmentService.getAssessmentDetails(a.id).subscribe({
      next: (res) => {
        this.activeAssessmentDetails = res;
        this.showSubmissionsModal.set(true);
      }
    });
  }

  openGradeDialog(sub: any): void {
    this.activeSubmissionToGrade = sub;
    this.gradeFormScore = sub.score ?? this.activeAssessmentDetails?.maxScore ?? 100;
    this.gradeFormLetter = sub.letterGrade ?? '';
    this.gradeFormFeedback = sub.feedback ?? 'Great work and clear methodology.';
    this.showGradeDialog.set(true);
  }

  submitGrade(): void {
    if (!this.activeSubmissionToGrade) return;

    const payload = {
      score: this.gradeFormScore,
      letterGrade: this.gradeFormLetter || undefined,
      feedback: this.gradeFormFeedback,
      teacherId: this.authService.currentUser()?.userId
    };

    this.submitting.set(true);
    this.assessmentService.gradeSubmission(this.activeSubmissionToGrade.id, payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toastService.show(res.message || 'Graded successfully!', 'success');
        this.showGradeDialog.set(false);
        if (this.activeAssessmentDetails) {
          this.openSubmissionsModal(this.activeAssessmentDetails);
        }
        this.loadAssessments();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show(err.error?.message || 'Grading failed.', 'error');
      }
    });
  }

  // Finalize Grade & Issue Certificate
  openFinalizeModal(row: MasterGradebookRow): void {
    this.activeStudentToFinalize = row;
    this.finalizeLetter = row.suggestedLetterGrade || 'A';
    this.finalizeHonors = row.honorsDistinction || 'High Distinction (Honors)';
    const cName = this.finalGradingData()?.courseName || this.gradebookData()?.courseName || 'course';
    this.finalizeRemarks = `Exceptional dedication and mastery in ${cName}. Cumulative Score: ${row.cumulativeScore}%.`;
    this.showFinalizeModal.set(true);
  }

  submitFinalizeGrade(): void {
    const courseId = this.selectedFinalGradingCourseId || this.selectedGradebookCourseId;
    if (!this.activeStudentToFinalize || !courseId) return;

    const payload = {
      studentId: this.activeStudentToFinalize.studentId,
      teacherId: this.authService.currentUser()?.userId || '',
      finalScore: this.activeStudentToFinalize.cumulativeScore,
      letterGrade: this.finalizeLetter,
      honorsDistinction: this.finalizeHonors,
      teacherRemarks: this.finalizeRemarks
    };

    this.submitting.set(true);
    this.assessmentService.finalizeCourseGrade(courseId, payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toastService.show(res.message || 'Course grade finalized & Digital Certificate generated!', 'success');
        this.closeModals();
        this.onFinalGradingCourseChange();
        this.loadMasterGradebook();
        if (res.certificateId) {
          this.viewGeneratedCert(res.certificateId, payload.studentId);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show(err.error?.message || 'Failed to finalize grade.', 'error');
      }
    });
  }

  viewGeneratedCert(certId?: string, studentId?: string): void {
    if (certId) {
      this.certificateService.getCertificateById(certId).subscribe({
        next: (cert) => {
          this.activeCertificate.set(cert);
          this.showCertModal.set(true);
        },
        error: () => {
          this.loadFallbackCertificate(studentId);
        }
      });
    } else {
      this.loadFallbackCertificate(studentId);
    }
  }

  loadFallbackCertificate(studentId?: string): void {
    const student = this.students().find(s => s.id === studentId);
    const course = this.courses().find(c => c.id === this.selectedGradebookCourseId);
    const cert: CertificateDto = {
      id: 'cert-preview',
      serialNumber: `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 1,
      recipientName: student ? `${student.firstName} ${student.lastName}` : (this.activeStudentToFinalize?.studentName || 'Abebe Bikila'),
      title: `Certificate of Academic Achievement - ${course?.name || this.gradebookData()?.courseName || 'Mathematics Grade 11'}`,
      description: `Awarded for successfully completing all coursework and examinations with ${this.activeStudentToFinalize?.honorsDistinction || 'High Distinction (Honors)'} (${this.activeStudentToFinalize?.suggestedLetterGrade || 'A+'} - ${this.activeStudentToFinalize?.cumulativeScore || 100}%).`,
      skillsLearned: `${course?.name || this.gradebookData()?.courseName || 'Mathematics Grade 11'} Core Competencies & Assessments`,
      timelineDuration: '3 Months (12 Weeks)',
      issueDate: new Date().toISOString(),
      attendancePercentage: 100
    };
    this.activeCertificate.set(cert);
    this.showCertModal.set(true);
  }

  downloadCertificatePdf(): void {
    const element = document.getElementById('printableCertificate');
    if (!element) return;

    this.toastService.show('Generating official A4 Landscape PDF...', 'info');
    html2canvas(element, { 
      scale: 3, 
      useCORS: true, 
      allowTaint: true, 
      logging: false,
      backgroundColor: '#ffffff'
    }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 4;

      const maxW = pageWidth - (margin * 2);
      const maxH = pageHeight - (margin * 2);

      let finalW = maxW;
      let finalH = (canvas.height * maxW) / canvas.width;

      if (finalH > maxH) {
        finalH = maxH;
        finalW = (canvas.width * maxH) / canvas.height;
      }

      const x = (pageWidth - finalW) / 2;
      const y = (pageHeight - finalH) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalW, finalH);
      const recipient = (this.activeCertificate()?.recipientName || 'Student').replace(/\s+/g, '_');
      pdf.save(`BrightTutor_Certificate_${recipient}.pdf`);
      this.toastService.show('Official A4 Certificate PDF downloaded successfully!', 'success');
    }).catch((err) => {
      console.error('PDF export error:', err);
      this.toastService.show('Failed to export PDF.', 'error');
    });
  }

  printCertificate(): void {
    const element = document.getElementById('printableCertificate');
    if (!element) return;

    this.toastService.show('Preparing high-definition print preview...', 'info');
    html2canvas(element, { 
      scale: 3, 
      useCORS: true, 
      allowTaint: true, 
      logging: false,
      backgroundColor: '#ffffff'
    }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        this.downloadCertificatePdf();
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Official Certificate - ${this.activeCertificate()?.recipientName || 'Student'}</title>
            <style>
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; height: 100vh; }
              img { width: 100vw; height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }).catch((err) => {
      console.error(err);
      this.downloadCertificatePdf();
    });
  }

  closeModals(): void {
    if (this.quizTimer) {
      clearInterval(this.quizTimer);
      this.quizTimer = null;
    }
    this.isEditMode.set(false);
    this.editingAssessmentId = null;
    this.showCreateModal.set(false);
    this.showQuizModal.set(false);
    this.showSubmitHwModal.set(false);
    this.showSubmissionsModal.set(false);
    this.showGradeDialog.set(false);
    this.showFinalizeModal.set(false);
    this.showCertModal.set(false);
  }

  ngOnDestroy(): void {
    if (this.quizTimer) {
      clearInterval(this.quizTimer);
      this.quizTimer = null;
    }
  }

  // UI Helpers
  getCardTypeClass(type: number): string {
    if (type === 1) return 'card-hw';
    if (type === 2) return 'card-quiz';
    if (type === 3) return 'card-test';
    return 'card-exam';
  }

  getTypeTagClass(type: number): string {
    if (type === 1) return 'tag-hw';
    if (type === 2) return 'tag-quiz';
    if (type === 3) return 'tag-test';
    return 'tag-exam';
  }

  getLetterGradeClass(grade: string): string {
    if (grade?.startsWith('A')) return 'grade-a';
    if (grade?.startsWith('B')) return 'grade-b';
    if (grade?.startsWith('C')) return 'grade-c';
    return 'grade-d';
  }

  formatDueDate(dateStr?: string): string {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
