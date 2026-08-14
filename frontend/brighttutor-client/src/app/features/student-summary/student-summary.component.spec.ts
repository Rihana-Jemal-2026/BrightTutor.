import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentSummaryComponent } from './student-summary.component';

describe('StudentSummaryComponent', () => {
  let component: StudentSummaryComponent;
  let fixture: ComponentFixture<StudentSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentSummaryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
