import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeAttendanceComponent } from './home-attendance.component';

describe('HomeAttendanceComponent', () => {
  let component: HomeAttendanceComponent;
  let fixture: ComponentFixture<HomeAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeAttendanceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeAttendanceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
