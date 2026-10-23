"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChipInputProps {
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Normalize a raw token; useful for uppercasing ("2a" -> "2A"). */
  format?: (token: string) => string;
  /**
   * Suggestions offered while typing. A suggestion is hidden as soon as it
   * is already a chip.
   */
  suggestions?: string[];
}

/**
 * Tag/chip input with:
 *  - comma or Enter to commit a token.
 *  - paste of "2A, 3A, 4A" splits on commas and adds each chip.
 *  - Backspace on empty input deletes the last chip.
 *  - ArrowLeft / ArrowRight navigates chips.
 *  - the hidden `<input name={name}>` reflects CSV for server actions.
 *  - optional suggestions that fill the input when clicked.
 */
export function ChipInput({
  name,
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  className,
  format,
  suggestions = [],
}: ChipInputProps) {
  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const tokens = React.useMemo(() => {
    const items = value.map((raw) => raw.trim()).filter(Boolean);
    return Array.from(new Set(items.map((token) => (format ? format(token) : token))));
  }, [value, format]);

  React.useEffect(() => {
    if (format) onChange(tokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (raw: string) => {
    const pieces = raw
      .split(/[,;\n]+/)
      .map((piece) => piece.trim())
      .filter(Boolean);
    if (!pieces.length) return;
    const next = format
      ? pieces.map((piece) => format(piece))
      : pieces;
    const merged = Array.from(new Set([...tokens, ...next]));
    onChange(merged);
    setInput("");
  };

  const remove = (token: string) => {
    onChange(tokens.filter((existing) => existing !== token));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (input.trim()) commit(input);
    } else if (event.key === "Backspace" && input === "" && tokens.length) {
      event.preventDefault();
      const next = [...tokens];
      next.pop();
      onChange(next);
    } else if (event.key === "ArrowLeft" && input === "" && tokens.length) {
      event.preventDefault();
      inputRef.current?.setSelectionRange(0, 0);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    if (/[,;\n]/.test(text)) {
      event.preventDefault();
      commit(text);
    }
  };

  // Suggestions that are not chips yet and match what has been typed.
  const matchingSuggestions = React.useMemo(() => {
    const needle = input.trim().toUpperCase();
    return suggestions
      .filter((suggestion) => !tokens.includes(suggestion))
      .filter((suggestion) =>
        needle ? suggestion.toUpperCase().includes(needle) : true,
      )
      .slice(0, 8);
  }, [input, suggestions, tokens]);

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "pointer-events-none cursor-not-allowed opacity-60",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tokens.map((token) => (
        <span
          key={token}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {token}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              remove(token);
            }}
            className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
            aria-label={`Quitar ${token}`}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className="flex-1 min-w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (input.trim()) commit(input);
        }}
      />
      <input type="hidden" name={name} value={tokens.join(",")} />

      {matchingSuggestions.length > 0 ? (
        <div className="flex w-full flex-wrap gap-1.5 pt-1">
          {matchingSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                commit(suggestion);
              }}
              className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
