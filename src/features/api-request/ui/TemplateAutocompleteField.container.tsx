"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Input, Textarea } from "@/shared";
import {
  applyTemplateSuggestion,
  findTemplateTokenAtCursor,
} from "../model/template-autocomplete.pure";

type TemplateAutocompleteFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  variableSuggestions: string[];
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  type?: string;
};

const MAX_VISIBLE_SUGGESTIONS = 8;

const normalizeSuggestionSource = (suggestions: string[]): string[] =>
  [...new Set(suggestions.map((item) => item.trim()).filter((item) => item.length > 0))].sort((a, b) =>
    a.localeCompare(b),
  );

export const TemplateAutocompleteField = ({
  value,
  onValueChange,
  variableSuggestions,
  placeholder,
  multiline = false,
  className,
  type,
}: TemplateAutocompleteFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  const [tokenQuery, setTokenQuery] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const suggestionSource = useMemo(
    () => normalizeSuggestionSource(variableSuggestions),
    [variableSuggestions],
  );

  const visibleSuggestions = useMemo(() => {
    if (!tokenQuery) {
      return [];
    }

    const normalizedQuery = tokenQuery.trim().toLowerCase();
    const matches = suggestionSource.filter((item) => {
      if (normalizedQuery.length === 0) {
        return true;
      }

      return item.toLowerCase().includes(normalizedQuery);
    });

    return matches.slice(0, MAX_VISIBLE_SUGGESTIONS);
  }, [suggestionSource, tokenQuery]);

  useEffect(() => {
    if (visibleSuggestions.length === 0) {
      setActiveSuggestionIndex(0);
      setIsMenuOpen(false);
      return;
    }

    setIsMenuOpen(true);
    if (activeSuggestionIndex >= visibleSuggestions.length) {
      setActiveSuggestionIndex(0);
    }
  }, [activeSuggestionIndex, visibleSuggestions.length]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const updateTokenState = (nextValue: string, cursor: number | null) => {
    if (cursor === null) {
      setTokenQuery(null);
      setIsMenuOpen(false);
      return;
    }

    const token = findTemplateTokenAtCursor(nextValue, cursor);
    if (!token) {
      setTokenQuery(null);
      setIsMenuOpen(false);
      return;
    }

    setTokenQuery(token.query);
  };

  const getFieldElement = (): HTMLInputElement | HTMLTextAreaElement | null =>
    multiline ? textareaRef.current : inputRef.current;

  const handleSuggestionPick = (suggestion: string) => {
    const element = getFieldElement();
    if (!element) {
      return;
    }

    const cursor = element.selectionStart ?? value.length;
    const result = applyTemplateSuggestion(value, cursor, suggestion);
    if (!result) {
      return;
    }

    onValueChange(result.value);
    setTokenQuery(null);
    setIsMenuOpen(false);
    setActiveSuggestionIndex(0);

    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(result.nextCursor, result.nextCursor);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMenuOpen || visibleSuggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % visibleSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => {
        if (current === 0) {
          return visibleSuggestions.length - 1;
        }

        return current - 1;
      });
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selected = visibleSuggestions[activeSuggestionIndex];
      if (selected) {
        handleSuggestionPick(selected);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsMenuOpen(false);
      setTokenQuery(null);
    }
  };

  const fieldProps = {
    className,
    placeholder,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      onValueChange(nextValue);
      updateTokenState(nextValue, event.target.selectionStart);
    },
    onKeyDown: handleKeyDown,
    onClick: (event: MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateTokenState(value, event.currentTarget.selectionStart);
    },
    onKeyUp: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (
        event.key === "ArrowDown"
        || event.key === "ArrowUp"
        || event.key === "Enter"
        || event.key === "Tab"
        || event.key === "Escape"
      ) {
        return;
      }

      updateTokenState(value, event.currentTarget.selectionStart);
    },
    onFocus: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
      }

      updateTokenState(value, event.currentTarget.selectionStart);
    },
    onBlur: () => {
      blurTimeoutRef.current = window.setTimeout(() => {
        setIsMenuOpen(false);
      }, 120);
    },
  };

  return (
    <div className="relative">
      {multiline ? (
        <Textarea {...fieldProps} ref={textareaRef} />
      ) : (
        <Input {...fieldProps} autoComplete="off" ref={inputRef} spellCheck={false} type={type} />
      )}

      {isMenuOpen && visibleSuggestions.length > 0 ? (
        <div className="absolute z-40 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
          <ul className="max-h-48 overflow-auto">
            {visibleSuggestions.map((suggestion, index) => (
              <li key={suggestion}>
                <button
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                    index === activeSuggestionIndex
                      ? "bg-secondary text-secondary-foreground"
                      : "text-popover-foreground hover:bg-secondary/70"
                  }`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSuggestionPick(suggestion);
                  }}
                  type="button"
                >
                  <span className="font-mono text-xs text-muted-foreground">{"{{ }}"}</span>
                  <span className="truncate">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
