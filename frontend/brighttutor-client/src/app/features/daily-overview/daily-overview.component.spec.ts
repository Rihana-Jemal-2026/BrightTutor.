import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyOverviewComponent } from './daily-overview.component';

describe('DailyOverviewComponent', () => {
  let component: DailyOverviewComponent;
  let fixture: ComponentFixture<DailyOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyOverviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
