import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-turquoise",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-turquoise",
        className,
      )}
      {...props}
    />
  );
}

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-turquoise",
        className,
      )}
      {...props}
    />
  );
}

export { Input, NativeSelect, Textarea };
