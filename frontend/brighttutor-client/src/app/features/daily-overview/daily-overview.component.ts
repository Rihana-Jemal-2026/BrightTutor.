import { Component, inject, signal } from "@angular/core";
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
  date = signal(new Date().toISOString().slice(0, 10));

  overviewResource = rxResource<any, unknown>({
    stream: () => this.api.getDailyOverview(this.date()),
  });

  search() {
    this.overviewResource.reload();
  }
}