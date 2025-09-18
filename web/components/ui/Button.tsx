import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Loader2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type ButtonStatus = "idle" | "loading" | "success" | "error";

type IconPosition = "start" | "end";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-[1.1rem] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85 focus-visible:ring-secondary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive",
        ghost:
          "bg-transparent text-foreground hover:bg-muted focus-visible:ring-muted",
        outline:
          "border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0 focus-visible:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

const statusIcons: Record<Exclude<ButtonStatus, "idle">, React.ReactElement> = {
  loading: <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />, 
  success: <Check className="size-4" aria-hidden="true" />, 
  error: <TriangleAlert className="size-4" aria-hidden="true" />,
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  status?: ButtonStatus;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  fluid?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      status = "idle",
      icon,
      iconPosition = "start",
      fullWidth,
      fluid,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isIconOnly = !children && !!icon;
    const isLoading = status === "loading";
    const isSuccess = status === "success";
    const isError = status === "error";

    const renderStatusIcon = () => {
      if (status === "idle") return null;
      return (
        <span
          data-slot="status-icon"
          className={cn(
            "flex items-center justify-center",
            status === "error" ? "text-destructive" : undefined,
            status === "success" ? "text-success" : undefined
          )}
        >
          {statusIcons[status]}
        </span>
      );
    };

    const content = (
      <span className={cn("flex items-center gap-2", isIconOnly && "sr-only")}>{children}</span>
    );

    const iconMarkup = icon ? (
      <span className="flex items-center" aria-hidden="true">
        {icon}
      </span>
    ) : null;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth: fluid ?? fullWidth, className }),
          isIconOnly && "px-0",
          isError && "motion-safe:animate-button-shake",
          "ring-offset-background"
        )}
        ref={ref}
        data-status={status}
        aria-busy={isLoading || undefined}
        aria-live={isSuccess || isError ? "polite" : undefined}
        disabled={disabled || isLoading}
        {...props}
      >
        {!children && iconMarkup}
        {!!children && icon && iconPosition === "start" && iconMarkup}
        {!!children && status !== "idle" && iconPosition === "start" && renderStatusIcon()}
        {!!children && content}
        {!!children && icon && iconPosition === "end" && iconMarkup}
        {!!children && status !== "idle" && iconPosition === "end" && renderStatusIcon()}
        {!children && status !== "idle" && renderStatusIcon()}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
