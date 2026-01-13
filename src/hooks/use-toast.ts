'use client';

export type ToastVariant = 'default' | 'destructive' | 'success';

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

/**
 * Minimal toast API (shadcn-style signature).
 * This is intentionally lightweight so the app compiles even if you
 * haven't installed a full toast UI system yet.
 */
export function toast(opts: ToastOptions): void {
  if (typeof window === 'undefined') return;

  // eslint-disable-next-line no-console
  console.info('[toast]', opts);

  // Optional fallback alert only for destructive to avoid noise
  if (opts.variant === 'destructive') {
    const msg = [opts.title, opts.description].filter(Boolean).join('\n');
    if (msg) window.alert(msg);
  }
}

export function useToast() {
  return { toast };
}
