import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  id: string;
  name: string;
  subtext?: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="searchable-select-wrapper">
      <label *ngIf="label" class="select-label">{{ label }}</label>

      <!-- Selected Value Trigger Box -->
      <div class="select-trigger" (click)="toggleOpen($event)">
        <span class="selected-text" [class.placeholder]="!selectedOption">
          {{ selectedOption ? selectedOption.name : placeholder }}
        </span>
        <span class="chevron">▼</span>
      </div>

      <!-- Dropdown Popup Menu -->
      @if (isOpen()) {
        <div class="select-dropdown-menu">
          <!-- Search Input Box at Top -->
          <div class="search-box">
            <input
              type="text"
              [placeholder]="searchPlaceholder"
              [(ngModel)]="searchQuery"
              (click)="$event.stopPropagation()"
            />
          </div>

          <!-- Filtered Options List -->
          <div class="options-list">
            @for (opt of filteredOptions; track opt.id) {
              <div
                class="option-item"
                [class.selected]="opt.id === value"
                (click)="selectOption(opt, $event)"
              >
                <div class="opt-name">{{ opt.name }}</div>
                @if (opt.subtext) {
                  <div class="opt-subtext">{{ opt.subtext }}</div>
                }
              </div>
            } @empty {
              <div class="no-options">No matching options found.</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .searchable-select-wrapper { position: relative; width: 100%; }
    .select-label { display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }
    .select-trigger {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 1rem; background: white; border: 1px solid #cbd5e1;
      border-radius: 8px; cursor: pointer; transition: border-color 0.2s;
    }
    .select-trigger:hover { border-color: #059669; }
    .selected-text { font-size: 0.9rem; color: #0f172a; font-weight: 500; }
    .selected-text.placeholder { color: #94a3b8; font-weight: 400; }
    .chevron { font-size: 0.7rem; color: #64748b; }
    .select-dropdown-menu {
      position: absolute; top: calc(100% + 4px); left: 0; width: 100%;
      background: white; border: 1px solid #cbd5e1; border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.12); z-index: 999; overflow: hidden;
    }
    .search-box { padding: 0.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .search-box input {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1;
      border-radius: 6px; font-size: 0.85rem; outline: none;
    }
    .search-box input:focus { border-color: #059669; }
    .options-list { max-height: 200px; overflow-y: auto; }
    .option-item {
      padding: 0.65rem 1rem; cursor: pointer; border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }
    .option-item:hover { background: #e9f7ef; }
    .option-item.selected { background: #d1fae5; font-weight: 600; color: #065f46; }
    .opt-name { font-size: 0.9rem; color: #0f172a; }
    .opt-subtext { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
    .no-options { padding: 1rem; text-align: center; color: #94a3b8; font-size: 0.85rem; }
  `]
})
export class SearchableSelectComponent {
  @Input() label: string = '';
  @Input() placeholder: string = 'Select an option...';
  @Input() searchPlaceholder: string = 'Search...';
  @Input() options: SelectOption[] = [];
  @Input() value: string = '';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal<boolean>(false);
  searchQuery: string = '';

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  get selectedOption(): SelectOption | null {
    return (this.options || []).find(opt => opt.id === this.value) || null;
  }

  get filteredOptions(): SelectOption[] {
    const q = (this.searchQuery || '').toLowerCase().trim();
    if (!q) return this.options || [];
    return (this.options || []).filter(opt =>
      opt.name.toLowerCase().includes(q) ||
      (opt.subtext && opt.subtext.toLowerCase().includes(q))
    );
  }

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update(val => !val);
  }

  selectOption(opt: SelectOption, event: MouseEvent): void {
    event.stopPropagation();
    this.value = opt.id;
    this.valueChange.emit(opt.id);
    this.isOpen.set(false);
    this.searchQuery = '';
  }
}
