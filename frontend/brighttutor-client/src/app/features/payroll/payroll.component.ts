import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService, TeacherPayrollDto, StudentInvoiceDto } from '../../services/payroll.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payroll-page">
      <div class="page-header">
        <div>
          <h1>Integrated Payroll & Student Invoicing</h1>
          <p>Automated calculation of teacher payout statements and student billing by service delivery method.</p>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-bar">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'payouts'" (click)="activeTab.set('payouts')">
           Teacher Payout Statements ({{ payouts().length }})
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'invoices'" (click)="activeTab.set('invoices')">
           Student Invoices & Billing ({{ invoices().length }})
        </button>
      </div>

      <!-- Rate Rules Summary Banner -->
      <div class="rate-summary-card">
        <div class="rate-badge-item">
          <span class="icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg></span>
          <div>
            <strong>Online 1-on-1</strong>
            <p>Teacher: $30/hr | Student: $45/hr</p>
          </div>
        </div>
        <div class="rate-badge-item">
          <span class="icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></svg></span>
          <div>
            <strong>Group Sessions</strong>
            <p>Teacher: $40/hr | Student: $25/student/hr</p>
          </div>
        </div>
        <div class="rate-badge-item">
          <span class="icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z"/></svg></span>
          <div>
            <strong>Home-to-Home Visit</strong>
            <p>Teacher: $50/visit + $10 travel | Student: $75/visit</p>
          </div>
        </div>
      </div>

      <!-- 1. Teacher Payout Statements View -->
      @if (activeTab() === 'payouts') {
        <div class="payouts-grid">
          @for (payout of payouts(); track payout.teacherId) {
            <div class="statement-card">
              <div class="statement-header">
                <div>
                  <h3>{{ payout.teacherName }}</h3>
                  <span class="sub-text">{{ payout.specialization }}</span>
                </div>
                <div class="total-pay-pill">\${{ formatCurrency(payout.totalEarnings) }}</div>
              </div>

              <div class="metrics-row">
                <div class="metric-box">
                  <span class="label">Total Hours</span>
                  <span class="value">{{ payout.totalHours }} hrs</span>
                </div>
                <div class="metric-box">
                  <span class="label">Sessions</span>
                  <span class="value">{{ payout.totalSessions }}</span>
                </div>
                <div class="metric-box">
                  <span class="label">Travel Allowance</span>
                  <span class="value">\${{ formatCurrency(payout.travelAllowance) }}</span>
                </div>
              </div>

              <div class="breakdown-list">
                <h4>Earnings Breakdown by Delivery Method</h4>
                <div class="breakdown-item">
                  <span> Online Sessions</span>
                  <span>\${{ formatCurrency(payout.onlineEarnings) }}</span>
                </div>
                <div class="breakdown-item">
                  <span> Group Classes</span>
                  <span>\${{ formatCurrency(payout.groupEarnings) }}</span>
                </div>
                <div class="breakdown-item">
                  <span> Home Visits</span>
                  <span>\${{ formatCurrency(payout.homeVisitEarnings) }}</span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">No teacher payout records found for the selected billing period.</div>
          }
        </div>
      }

      <!-- 2. Student Invoices & Billing View -->
      @if (activeTab() === 'invoices') {
        <div class="invoices-grid">
          @for (invoice of invoices(); track invoice.studentId) {
            <div class="statement-card invoice-card">
              <div class="statement-header">
                <div>
                  <h3>{{ invoice.studentName }}</h3>
                  <span class="sub-text">Code: {{ invoice.studentCode }} | {{ invoice.gradeLevel }}</span>
                </div>
                <div class="total-pay-pill invoice-pill">\${{ formatCurrency(invoice.totalAmountDue) }}</div>
              </div>

              <div class="metrics-row">
                <div class="metric-box">
                  <span class="label">Sessions Attended</span>
                  <span class="value">{{ invoice.totalSessionsAttended }}</span>
                </div>
                <div class="metric-box">
                  <span class="label">Invoice Date</span>
                  <span class="value">{{ invoice.invoiceDate | date:'mediumDate' }}</span>
                </div>
              </div>

              <div class="breakdown-list">
                <h4>Invoice Charge Summary</h4>
                <div class="breakdown-item">
                  <span> Online Sessions</span>
                  <span>\${{ formatCurrency(invoice.onlineTotal) }}</span>
                </div>
                <div class="breakdown-item">
                  <span> Group Sessions</span>
                  <span>\${{ formatCurrency(invoice.groupTotal) }}</span>
                </div>
                <div class="breakdown-item">
                  <span> Home Visits</span>
                  <span>\${{ formatCurrency(invoice.homeVisitTotal) }}</span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">No student invoice records found for the selected billing period.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .payroll-page { padding: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; color: var(--color-primary); margin-bottom: 0.25rem; }
    .page-header p { color: var(--color-muted); margin: 0 0 1.5rem 0; }

    .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); }
    .tab-btn { background: none; border: none; padding: 0.75rem 1.25rem; font-weight: 600; color: var(--color-muted); border-bottom: 2px solid transparent; cursor: pointer; font-size: 0.9rem; }
    .tab-btn.active { color: var(--color-accent-bright); border-bottom-color: var(--color-accent-bright); }

    .rate-summary-card { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); padding: 1rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; box-shadow: var(--shadow-card); }
    .rate-badge-item { display: flex; align-items: center; gap: 0.75rem; }
    .rate-badge-item .icon { font-size: 1.5rem; }
    .rate-badge-item strong { display: block; font-size: 0.9rem; color: var(--color-text); }
    .rate-badge-item p { margin: 0; font-size: 0.8rem; color: var(--color-muted); }

    .payouts-grid, .invoices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; }
    .statement-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-card); }
    .statement-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .statement-header h3 { margin: 0 0 0.2rem 0; font-size: 1.15rem; color: var(--color-text); }
    .sub-text { font-size: 0.8rem; color: var(--color-muted); }
    .total-pay-pill { background: var(--color-success-bg); color: var(--color-success); font-weight: 700; font-size: 1.1rem; padding: 0.4rem 0.85rem; border-radius: 8px; border: 1px solid rgba(var(--color-accent-rgb), 0.3); }
    .total-pay-pill.invoice-pill { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border-color: rgba(59, 130, 246, 0.3); }

    .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: var(--color-bg); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; }
    .metric-box .label { display: block; font-size: 0.7rem; color: var(--color-muted); text-transform: uppercase; }
    .metric-box .value { font-weight: 700; font-size: 0.95rem; color: var(--color-text); }

    .breakdown-list h4 { margin: 0 0 0.5rem 0; font-size: 0.85rem; color: var(--color-muted); text-transform: uppercase; }
    .breakdown-item { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--color-border); font-size: 0.85rem; color: var(--color-text); }
    .breakdown-item:last-child { border-bottom: none; }
    .empty-state { text-align: center; padding: 3rem; color: var(--color-muted); background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); width: 100%; }
  `]
})
export class PayrollComponent implements OnInit {
  payouts = signal<TeacherPayrollDto[]>([]);
  invoices = signal<StudentInvoiceDto[]>([]);
  activeTab = signal<'payouts' | 'invoices'>('payouts');

  private payrollService = inject(PayrollService);

  ngOnInit(): void {
    this.loadPayrollData();
  }

  formatCurrency(val: number | undefined | null): string {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return Number(val).toFixed(2);
  }

  loadPayrollData(): void {
    this.payrollService.getTeacherPayouts().subscribe({
      next: (res) => this.payouts.set(res)
    });

    this.payrollService.getStudentInvoices().subscribe({
      next: (res) => this.invoices.set(res)
    });
  }
}
