import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkTeacherAttendanceComponent } from './mark-teacher-attendance.component';

describe('MarkTeacherAttendanceComponent', () => {
  let component: MarkTeacherAttendanceComponent;
  let fixture: ComponentFixture<MarkTeacherAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkTeacherAttendanceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkTeacherAttendanceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
