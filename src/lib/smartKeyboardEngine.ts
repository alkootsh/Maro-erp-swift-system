/**
 * @file smartKeyboardEngine.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: smartKeyboardEngine.ts.
 */
// MARO ERP - Smart Keyboard & Table Navigation Engine
// Sprint 8.2 Enterprise Usability Architecture
// Provides: Enter key navigation, Arrow Key grid traversal, Auto-Select on Focus, InputMode triggers, & Function Key handlers.

export interface SmartNavConfig {
  containerRef?: React.RefObject<HTMLElement | null>;
  onEnterAtEnd?: () => void;
  onFunctionKey?: (key: string, event: KeyboardEvent) => void;
  enableArrowNavigation?: boolean;
}

/**
 * Focuses the next focusable input/select/textarea inside a container or table.
 * If at the last element and onEnterAtEnd callback is passed, triggers it (e.g. add new row).
 */
export function focusNextField(
  currentElement: HTMLElement,
  containerElement?: HTMLElement | null,
  onEnterAtEnd?: () => void
): boolean {
  const root = containerElement || currentElement.closest('form, table, tbody, div[data-smart-nav="true"]') || document.body;
  
  // Find all focusable editable inputs
  const selector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]), button[data-focusable="true"]';
  const focusables = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    el => el.offsetWidth > 0 && el.offsetHeight > 0 && window.getComputedStyle(el).visibility !== 'hidden'
  );

  const currentIndex = focusables.indexOf(currentElement);
  
  if (currentIndex >= 0 && currentIndex < focusables.length - 1) {
    const next = focusables[currentIndex + 1];
    next.focus();
    if (next instanceof HTMLInputElement) {
      next.select();
    }
    return true;
  } else if (currentIndex === focusables.length - 1 && onEnterAtEnd) {
    onEnterAtEnd();
    return true;
  }
  return false;
}

/**
 * Focuses the previous focusable input/select/textarea inside a container or table.
 */
export function focusPreviousField(
  currentElement: HTMLElement,
  containerElement?: HTMLElement | null
): boolean {
  const root = containerElement || currentElement.closest('form, table, tbody, div[data-smart-nav="true"]') || document.body;
  const selector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])';
  const focusables = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    el => el.offsetWidth > 0 && el.offsetHeight > 0 && window.getComputedStyle(el).visibility !== 'hidden'
  );

  const currentIndex = focusables.indexOf(currentElement);
  if (currentIndex > 0) {
    const prev = focusables[currentIndex - 1];
    prev.focus();
    if (prev instanceof HTMLInputElement) {
      prev.select();
    }
    return true;
  }
  return false;
}

/**
 * Navigates grid cells vertically (ArrowUp / ArrowDown in table columns)
 */
export function focusVerticalTableCell(
  currentElement: HTMLElement,
  direction: 'up' | 'down'
): boolean {
  const td = currentElement.closest('td');
  const tr = currentElement.closest('tr');
  if (!td || !tr) return false;

  const cellIndex = Array.from(tr.children).indexOf(td);
  const targetTr = direction === 'down' ? tr.nextElementSibling : tr.previousElementSibling;
  
  if (targetTr) {
    const targetTd = targetTr.children[cellIndex] as HTMLElement;
    if (targetTd) {
      const input = targetTd.querySelector<HTMLInputElement | HTMLSelectElement>('input:not([disabled]), select:not([disabled])');
      if (input) {
        input.focus();
        if (input instanceof HTMLInputElement) {
          input.select();
        }
        return true;
      }
    }
  }
  return false;
}

/**
 * Keydown handler for inputs inside tables & forms.
 * Call this in your input `onKeyDown` or at container level.
 */
export function handleSmartKeyDown(
  e: React.KeyboardEvent<HTMLElement> | KeyboardEvent,
  options?: {
    containerRef?: React.RefObject<HTMLElement | null>;
    onEnterAtEnd?: () => void;
    onEscape?: () => void;
    onSaveShortcut?: () => void;
  }
) {
  const target = e.target as HTMLElement;
  if (!target || !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
    return;
  }

  const container = options?.containerRef?.current || null;

  // 1. Enter key navigation
  if (e.key === 'Enter') {
    // For multiline textareas, require Shift+Enter for new line, plain Enter moves next
    if (target.tagName === 'TEXTAREA' && e.shiftKey) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    focusNextField(target, container, options?.onEnterAtEnd);
    return;
  }

  // 2. Arrow Up / Arrow Down navigation
  if (e.key === 'ArrowDown') {
    // Try vertical table cell navigation first
    if (focusVerticalTableCell(target, 'down')) {
      e.preventDefault();
      return;
    }
    // Fallback to next field
    e.preventDefault();
    focusNextField(target, container);
    return;
  }

  if (e.key === 'ArrowUp') {
    // Try vertical table cell navigation first
    if (focusVerticalTableCell(target, 'up')) {
      e.preventDefault();
      return;
    }
    // Fallback to previous field
    e.preventDefault();
    focusPreviousField(target, container);
    return;
  }

  // 3. Escape key to clear or close
  if (e.key === 'Escape' && options?.onEscape) {
    e.preventDefault();
    options.onEscape();
    return;
  }

  // 4. Ctrl+S or Ctrl+Enter Save Shortcut
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
    if (options?.onSaveShortcut) {
      e.preventDefault();
      options.onSaveShortcut();
    }
  }
}

/**
 * Helper to auto-select text on input focus
 */
export function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select();
}

/**
 * Returns input attributes for activating mobile/tablet numeric keyboard
 */
export function getNumericInputProps(isDecimal: boolean = true) {
  return {
    inputMode: isDecimal ? ('decimal' as const) : ('numeric' as const),
    pattern: isDecimal ? '[0-9]*[.,]?[0-9]*' : '[0-9]*',
    onFocus: handleInputFocus,
  };
}

/**
 * Returns input attributes for text input with auto-select
 */
export function getTextInputProps() {
  return {
    inputMode: 'text' as const,
    onFocus: handleInputFocus,
  };
}
