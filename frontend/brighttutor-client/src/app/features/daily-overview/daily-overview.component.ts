import { Component, inject, computed, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";

@Component({
  selector: "app-daily-overview",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./daily-overview.component.html",
  styleUrl: "./daily-overview.component.scss",
})
export class DailyOverviewComponent {
  private api = inject(AttendanceService);
  private today = new Date();
  date = signal(`${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}-${String(this.today.getDate()).padStart(2, '0')}`);

  filtersTouched = signal(true);
  optionsError = signal('');
  canSearch = computed(() => !!this.date() && !this.optionsError());

  overviewResource = rxResource({
    params: () => this.filtersTouched() && this.canSearch() ? { date: this.date() } : undefined,
    stream: ({ params }) => this.api.getDailyOverview(params.date),
  });

  search() {
    if (!this.canSearch()) return;
    if (this.filtersTouched()) this.overviewResource.reload();
    else this.filtersTouched.set(true);
  }
}
