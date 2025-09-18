import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

type AutoResizeTextareaProps = Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange"> & {
  value: string;
  onValueChange?: (value: string) => void;
  minRows?: number;
  maxRows?: number;
  showCount?: boolean;
  maxCharacters?: number;
};

export const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  (
    { value, onValueChange, minRows = 3, maxRows = 10, showCount = true, maxCharacters, className, ...props },
    ref
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    React.useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      const lineHeight = parseInt(getComputedStyle(el).lineHeight || "20", 10);
      const minHeight = minRows * lineHeight;
      const maxHeight = maxRows * lineHeight;
      el.style.height = "auto";
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, el.scrollHeight));
      el.style.height = `${nextHeight}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [value, minRows, maxRows]);

    const remaining = maxCharacters ? Math.max(maxCharacters - value.length, 0) : null;

    return (
      <div className="grid gap-1.5">
        <Textarea
          {...props}
          ref={innerRef}
          value={value}
          onChange={(event) => {
            props.onChange?.(event);
            const nextValue = maxCharacters
              ? event.target.value.slice(0, maxCharacters)
              : event.target.value;
            onValueChange?.(nextValue);
          }}
          className={cn("resize-none", className)}
        />
        {showCount && maxCharacters != null && (
          <div className="text-right text-xs text-muted-foreground">
            {remaining} characters left
          </div>
        )}
      </div>
    );
  }
);
AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { Textarea };
