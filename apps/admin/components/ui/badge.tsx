import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-[#f3ead2] px-2 py-0.5 text-xs text-[#6a5424]", className)}
      {...props}
    />
  );
}

export { Badge };
