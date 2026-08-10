import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkGroupAttendanceComponent } from './mark-group-attendance.component';

describe('MarkGroupAttendanceComponent', () => {
  let component: MarkGroupAttendanceComponent;
  let fixture: ComponentFixture<MarkGroupAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkGroupAttendanceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkGroupAttendanceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
