import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewGroupAttendanceComponent } from './view-group-attendance.component';

describe('ViewGroupAttendanceComponent', () => {
  let component: ViewGroupAttendanceComponent;
  let fixture: ComponentFixture<ViewGroupAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewGroupAttendanceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewGroupAttendanceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
