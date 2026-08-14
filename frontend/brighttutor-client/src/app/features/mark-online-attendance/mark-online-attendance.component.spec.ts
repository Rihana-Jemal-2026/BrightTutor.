import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkOnlineAttendanceComponent } from './mark-online-attendance.component';

describe('MarkOnlineAttendanceComponent', () => {
  let component: MarkOnlineAttendanceComponent;
  let fixture: ComponentFixture<MarkOnlineAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkOnlineAttendanceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkOnlineAttendanceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
