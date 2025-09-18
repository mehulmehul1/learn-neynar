import * as React from "react";
import { ImageIcon, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

type TickerStatus = "idle" | "checking" | "available" | "conflict";

type TickerInputProps = Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> & {
  value: string;
  onValueChange?: (value: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  debounceMs?: number;
  checkAvailability?: (symbol: string) => Promise<"available" | "conflict">;
  helperText?: string;
};

const statusCopy: Record<TickerStatus, { label: string; tone: string; sr: string }> = {
  idle: { label: "", tone: "", sr: "Ticker availability reset" },
  checking: { label: "Checking…", tone: "text-muted-foreground", sr: "Checking ticker availability" },
  available: { label: "Available", tone: "text-success", sr: "Ticker is available" },
  conflict: { label: "Taken", tone: "text-destructive", sr: "Ticker already in use" },
};

export const TickerInput = React.forwardRef<HTMLInputElement, TickerInputProps>(
  (
    {
      value,
      onValueChange,
      onChange,
      debounceMs = 400,
      checkAvailability,
      helperText,
      className,
      ...props
    },
    ref
  ) => {
    const [status, setStatus] = React.useState<TickerStatus>("idle");
    const [message, setMessage] = React.useState(helperText ?? "");
    const liveRegionRef = React.useRef<HTMLSpanElement>(null);
    const requestId = React.useRef(0);

    React.useEffect(() => {
      setMessage(helperText ?? "");
    }, [helperText]);

    React.useEffect(() => {
      if (!checkAvailability || value.trim().length === 0) {
        setStatus("idle");
        return;
      }
      setStatus("checking");
      const currentRequest = ++requestId.current;
      const handle = setTimeout(async () => {
        try {
          const availability = await checkAvailability(value.trim());
          if (currentRequest !== requestId.current) return;
          setStatus(availability);
          setMessage(
            availability === "available"
              ? "Great news! This ticker is free to use."
              : "This ticker is already taken. Try something more unique."
          );
        } catch (error) {
          if (currentRequest !== requestId.current) return;
          setStatus("conflict");
          setMessage("We couldn't verify availability. Please retry in a moment.");
        }
      }, debounceMs);

      return () => clearTimeout(handle);
    }, [checkAvailability, debounceMs, value]);

    React.useEffect(() => {
      if (status === "idle" && !helperText) {
        setMessage("");
      }
      const srCopy = statusCopy[status];
      if (liveRegionRef.current && srCopy?.sr) {
        liveRegionRef.current.textContent = srCopy.sr;
      }
    }, [status, helperText]);

    return (
      <div className="grid gap-2">
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            className={cn("pr-24 uppercase tracking-wide", className)}
            value={value}
            onChange={(event) => {
              onChange?.(event);
              onValueChange?.(event.target.value);
            }}
            aria-describedby={props["aria-describedby"] ?? undefined}
            autoCapitalize="characters"
            autoComplete="off"
          />
          {status !== "idle" && (
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold",
                statusCopy[status].tone
              )}
              aria-hidden="true"
            >
              {statusCopy[status].label}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
        <span ref={liveRegionRef} className="sr-only" aria-live="polite" />
      </div>
    );
  }
);
TickerInput.displayName = "TickerInput";

type MediaUploadFieldProps = {
  label?: string;
  description?: string;
  accept?: string;
  onFileSelect?: (file: File | null) => void;
  value?: { url: string; kind: "image" | "video" | "other" } | null;
  disabled?: boolean;
};

export const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label = "Upload media",
  description = "Drag and drop or browse from your device",
  accept = "image/*,video/mp4",
  onFileSelect,
  value,
  disabled,
}) => {
  const [preview, setPreview] = React.useState(value ?? null);
  const inputId = React.useId();
  const localObjectUrl = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value?.url, value?.kind]);

  React.useEffect(() => {
    return () => {
      if (localObjectUrl.current) {
        URL.revokeObjectURL(localObjectUrl.current);
      }
    };
  }, []);

  const updatePreview = React.useCallback(
    (file: File | null) => {
      if (localObjectUrl.current) {
        URL.revokeObjectURL(localObjectUrl.current);
        localObjectUrl.current = null;
      }

      if (!file) {
        setPreview(null);
        onFileSelect?.(null);
        return;
      }
      const kind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "other";
      const objectUrl = URL.createObjectURL(file);
      localObjectUrl.current = objectUrl;
      setPreview({ url: objectUrl, kind });
      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    updatePreview(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) return;
    event.currentTarget.classList.remove("border-primary", "bg-primary/5");
    const file = event.dataTransfer.files?.[0] ?? null;
    updatePreview(file ?? null);
  };

  return (
    <div className="grid gap-2">
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/70 bg-muted/30 px-6 py-8 text-center transition hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-60"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (disabled) return;
          event.currentTarget.classList.add("border-primary", "bg-primary/5");
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.currentTarget.classList.remove("border-primary", "bg-primary/5");
        }}
        onDrop={handleDrop}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
          <Upload className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <input
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </label>
      {preview && (
        <div className="rounded-lg border bg-muted p-3">
          {preview.kind === "image" ? (
            <img
              src={preview.url}
              alt="Uploaded preview"
              className="max-h-48 w-full rounded-md object-cover"
            />
          ) : preview.kind === "video" ? (
            <video controls className="max-h-48 w-full rounded-md">
              <source src={preview.url} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="size-4" />
              <span>Preview unavailable for this file type.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { Input };
