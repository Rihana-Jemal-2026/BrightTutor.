export enum AssessmentType {
  Homework = 1,
  Quiz = 2,
  Test = 3,
  Exam = 4,
  Project = 5
}

export enum SubmissionStatus {
  Submitted = 1,
  Graded = 2,
  Late = 3,
  ResubmissionRequested = 4
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOption: number;
  points: number;
}

export interface AssessmentDto {
  id: string;
  courseId: string;
  courseName: string;
  classGroupId?: string;
  classGroupName?: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  type: AssessmentType;
  typeName: string;
  maxScore: number;
  weightPercentage: number;
  durationMinutes?: number;
  dueDate?: string;
  hasQuestions: boolean;
  questionsJson?: string;
  attachmentUrl?: string;
  isPublished: boolean;
  createdAt: string;
  submissionsCount: number;
  gradedCount: number;
  studentSubmission?: StudentSubmissionDto;
}

export interface StudentSubmissionDto {
  id: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  submissionText?: string;
  attachmentUrl?: string;
  answersJson?: string;
  submittedAt: string;
  score?: number;
  letterGrade?: string;
  feedback?: string;
  status: SubmissionStatus;
  statusName: string;
  gradedAt?: string;
}

export interface MasterGradebookRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  profilePhotoUrl?: string;
  hwAverage: number;
  quizAverage: number;
  testAverage: number;
  cumulativeScore: number;
  suggestedLetterGrade: string;
  honorsDistinction: string;
  assessmentScores: {
    assessmentId: string;
    title: string;
    type: number;
    maxScore: number;
    score?: number;
    letterGrade?: string;
    status: string;
  }[];
  isFinalized: boolean;
  certificateId?: string;
  finalGrade?: {
    finalScore: number;
    letterGrade: string;
    honors: string;
    remarks?: string;
    finalizedAt?: string;
    certificateId?: string;
  };
}

export interface MasterGradebookResponse {
  courseId: string;
  courseName: string;
  assessments: {
    id: string;
    title: string;
    type: number;
    typeName: string;
    maxScore: number;
    weightPercentage: number;
  }[];
  students: MasterGradebookRow[];
}
