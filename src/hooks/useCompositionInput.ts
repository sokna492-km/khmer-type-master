import { useCallback, useEffect, useRef, type RefObject } from "react";

import {
  applyCompositionEnd,
  applyCompositionStart,
  applyCompositionUpdate,
  initialCompositionState,
  shouldScoreInput,
  type CompositionState,
} from "@/lib/typing-input";

type CommitFn = (nextValue: string) => { accepted: boolean; value: string };
type BackspaceFn = () => string;

type Options = {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  committed: string;
  completed: boolean;
  onCommit: CommitFn;
  onBackspace: BackspaceFn;
  onCompositionChange: (preedit: string) => void;
  onClearComposition: () => void;
  /** Called after a rejected strict commit so UI can resync the input. */
  onRejected?: () => void;
};

/**
 * Wires a visible (near-prompt) input to the typing session with IME safety.
 */
export function useCompositionInput({
  inputRef,
  committed,
  completed,
  onCommit,
  onBackspace,
  onCompositionChange,
  onClearComposition,
  onRejected,
}: Options) {
  const compositionRef = useRef<CompositionState>(initialCompositionState());

  // Keep DOM value in sync with committed text when not composing
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (compositionRef.current.isComposing) return;
    if (el.value !== committed) {
      el.value = committed;
    }
  }, [committed, inputRef]);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const handleCompositionStart = useCallback(() => {
    compositionRef.current = applyCompositionStart(compositionRef.current);
  }, []);

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      compositionRef.current = applyCompositionUpdate(
        compositionRef.current,
        e.data ?? "",
      );
      onCompositionChange(compositionRef.current.preedit);
    },
    [onCompositionChange],
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      const result = applyCompositionEnd(compositionRef.current, el.value);
      compositionRef.current = result.state;
      onClearComposition();
      if (completed) return;
      const { accepted, value } = onCommit(result.value);
      if (!accepted) {
        el.value = value;
        onRejected?.();
      } else {
        el.value = value;
      }
    },
    [completed, onCommit, onClearComposition, onRejected],
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (completed) return;
      const el = e.currentTarget;
      const native = e.nativeEvent as InputEvent;
      const composing =
        compositionRef.current.isComposing || native.isComposing === true;

      if (!shouldScoreInput(composing, native.inputType)) {
        onCompositionChange(el.value.slice(committed.length));
        return;
      }

      if (native.inputType === "deleteContentBackward") {
        // Prefer cluster-safe backspace from session
        const next = onBackspace();
        el.value = next;
        return;
      }

      const { accepted, value } = onCommit(el.value);
      if (!accepted) {
        el.value = value;
        onRejected?.();
      } else {
        el.value = value;
      }
    },
    [completed, committed.length, onCommit, onBackspace, onCompositionChange, onRejected],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (completed) {
        e.preventDefault();
        return;
      }
      if (compositionRef.current.isComposing || e.nativeEvent.isComposing) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        const next = onBackspace();
        if (inputRef.current) inputRef.current.value = next;
      }
    },
    [completed, onBackspace, inputRef],
  );

  return {
    focus,
    inputProps: {
      onCompositionStart: handleCompositionStart,
      onCompositionUpdate: handleCompositionUpdate,
      onCompositionEnd: handleCompositionEnd,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      autoCapitalize: "none" as const,
      autoCorrect: "off" as const,
      autoComplete: "off" as const,
      spellCheck: false,
    },
  };
}
