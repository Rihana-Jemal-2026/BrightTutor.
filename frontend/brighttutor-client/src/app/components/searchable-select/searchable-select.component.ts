import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener, inject } from '@angular/core';
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
    <div class="searchable-select-wrapper" [class.is-open]="isOpen()" [class.is-disabled]="disabled">
      <label *ngIf="label" class="select-label">{{ label }}</label>

      <!-- Selected Value Trigger Box -->
      <div class="select-trigger" (click)="toggleOpen()">
        <span class="selected-text" [class.placeholder]="!selectedOption">
          {{ selectedOption ? selectedOption.name : placeholder }}
        </span>
        <span class="chevron">▼</span>
      </div>

      <!-- Dropdown Popup Menu -->
      @if (isOpen()) {
        <div class="select-dropdown-menu" (click)="$event.stopPropagation()">
          <!-- Search Input Box at Top -->
          <div class="search-box">
            <input
              type="text"
              [placeholder]="searchPlaceholder"
              [(ngModel)]="searchQuery"
              (click)="$event.stopPropagation()"
              autofocus
            />
          </div>

          <!-- Filtered Options List -->
          <div class="options-list">
            @for (opt of filteredOptions; track opt.id) {
              <div
                class="option-item"
                [class.selected]="opt.id === value"
                (click)="selectOption(opt)"
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
    .searchable-select-wrapper {
      position: relative;
      width: 100%;
      z-index: 1;

      &.is-open {
        z-index: 1000;
      }

      &.is-disabled {
        opacity: 0.65;
        pointer-events: none;
      }
    }

    .select-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.35rem;
    }

    .select-trigger {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: #2563eb;
      }
    }

    .selected-text {
      font-size: 0.9rem;
      color: #0f172a;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &.placeholder {
        color: #94a3b8;
        font-weight: 400;
      }
    }

    .chevron {
      font-size: 0.65rem;
      color: #64748b;
      margin-left: 0.5rem;
    }

    .select-dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 100%;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
      z-index: 99999;
      overflow: hidden;
      animation: fadeIn 0.15s ease-out;
    }

    .search-box {
      padding: 0.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;

      input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.85rem;
        outline: none;

        &:focus {
          border-color: #2563eb;
        }
      }
    }

    .options-list {
      max-height: 210px;
      overflow-y: auto;
    }

    .option-item {
      padding: 0.65rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;

      &:hover {
        background: #eff6ff;
      }

      &.selected {
        background: #dbeafe;
        font-weight: 600;
        color: #1e40af;
      }
    }

    .opt-name {
      font-size: 0.9rem;
      color: #0f172a;
    }

    .opt-subtext {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 2px;
    }

    .no-options {
      padding: 1rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.85rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SearchableSelectComponent {
  private elementRef = inject(ElementRef);

  @Input() label: string = '';
  @Input() placeholder: string = 'Select an option...';
  @Input() searchPlaceholder: string = 'Search...';
  @Input() options: SelectOption[] = [];
  @Input() value: string = '';
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal<boolean>(false);
  searchQuery: string = '';

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

  toggleOpen(): void {
    if (this.disabled) return;
    this.isOpen.update(val => !val);
  }

  selectOption(opt: SelectOption): void {
    this.value = opt.id;
    this.valueChange.emit(opt.id);
    this.isOpen.set(false);
    this.searchQuery = '';
  }
}
