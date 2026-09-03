import { Injectable, signal } from "@angular/core";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private counter = 0;
  toasts = signal<ToastMessage[]>([]);

  showSuccess(message: string, durationMs = 2500) {
    this.addToast("success", message, durationMs);
  }

  showError(message: string, durationMs = 3000) {
    this.addToast("error", message, durationMs);
  }

  showInfo(message: string, durationMs = 2500) {
    this.addToast("info", message, durationMs);
  }

  showWarning(message: string, durationMs = 3000) {
    this.addToast("info", message, durationMs);
  }

  show(message: string, type: "success" | "error" | "info" = "info", durationMs = 2500) {
    this.addToast(type, message, durationMs);
  }

  private addToast(type: "success" | "error" | "info", message: string, durationMs: number) {
    const id = ++this.counter;
    const newToast: ToastMessage = { id, type, message };

    // Update toasts signal instantly
    this.toasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.removeToast(id);
    }, durationMs);
  }

  removeToast(id: number) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
