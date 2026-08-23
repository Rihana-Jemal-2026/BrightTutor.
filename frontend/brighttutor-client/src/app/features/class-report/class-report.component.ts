import { Component, inject, signal, OnInit } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import { AttendanceService } from "../../services/attendance.service";
import { CourseService } from "../../services/course.service";
import { ClassAttendanceReport } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-class-report",
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: "./class-report.component.html",
  styleUrl: "./class-report.component.scss",
})
export class ClassReportComponent implements OnInit {
  private api = inject(AttendanceService);
  private courseService = inject(CourseService);

  groupOptions = signal<SelectOption[]>([]);
  classGroupId = signal("");
  startDate = signal("2026-08-01");
  endDate = signal(new Date().toISOString().slice(0, 10));

  reportResource = rxResource<ClassAttendanceReport | null, unknown>({
    stream: () => {
      const id = this.classGroupId();
      if (!id) return of(null);
      return this.api.getClassReport(id, this.startDate(), this.endDate());
    },
  });

  ngOnInit() {
    this.courseService.getClassGroups().subscribe({
      next: (groups) => {
        const opts = groups.map(g => ({
          id: g.id,
          name: g.name,
          subtext: g.courseName
        }));
        this.groupOptions.set(opts);
        if (opts.length > 0) {
          this.classGroupId.set(opts[0].id);
          this.search();
        }
      }
    });
  }

  onGroupSelected(groupId: string) {
    this.classGroupId.set(groupId);
    this.search();
  }

  search() {
    this.reportResource.reload();
  }
}