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
      <div class="select-trigger" (click)="toggleOpen($event)">
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
      color: var(--color-muted);
      margin-bottom: 0.35rem;
    }

    .select-trigger {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: var(--color-accent-bright);
      }
    }

    .selected-text {
      font-size: 0.9rem;
      color: var(--color-text);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &.placeholder {
        color: var(--color-muted);
        font-weight: 400;
      }
    }

    .chevron {
      font-size: 0.65rem;
      color: var(--color-muted);
      margin-left: 0.5rem;
    }

    .select-dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 100%;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: 10px;
      box-shadow: var(--shadow-card);
      z-index: 99999;
      overflow: hidden;
      animation: fadeIn 0.15s ease-out;
    }

    .search-box {
      padding: 0.5rem;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);

      input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: var(--color-surface);
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: 6px;
        font-size: 0.85rem;
        outline: none;

        &:focus {
          border-color: var(--color-accent-bright);
        }
      }
    }

    .options-list {
      max-height: 210px;
      overflow-y: auto;
      background: var(--color-surface);
    }

    .option-item {
      padding: 0.65rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      transition: background 0.15s;

      &:hover {
        background: rgba(var(--color-accent-rgb), 0.12);
      }

      &.selected {
        background: var(--color-success-bg);
        font-weight: 600;
        color: var(--color-accent-bright);
      }
    }

    .opt-name {
      font-size: 0.9rem;
      color: var(--color-text);
    }

    .opt-subtext {
      font-size: 0.75rem;
      color: var(--color-muted);
      margin-top: 2px;
    }

    .no-options {
      padding: 1rem;
      text-align: center;
      color: var(--color-muted);
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

  toggleOpen(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.disabled) return;
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
