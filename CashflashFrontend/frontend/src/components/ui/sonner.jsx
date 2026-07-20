import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#f5f5f5" : "#1f2937";

  return (
    <Sonner
      theme={resolvedTheme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: isDark
            ? "rgba(39, 39, 42, 0.98)"
            : "rgba(229, 231, 235, 0.98)",
          color: textColor,
          border: isDark
            ? "1px solid rgba(63, 63, 70, 1)"
            : "1px solid rgba(209, 213, 219, 1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: isDark
            ? "0 12px 30px rgba(0, 0, 0, 0.32)"
            : "0 12px 30px rgba(15, 23, 42, 0.08)",
          borderRadius: "16px",
        },
        classNames: {
          toast: "!rounded-2xl",
          title: isDark ? "!font-semibold !text-zinc-100" : "!font-semibold !text-gray-800",
          description: isDark ? "!text-zinc-300" : "!text-gray-600",
          actionButton: isDark
            ? "!bg-zinc-700 !text-zinc-100 hover:!bg-zinc-600 !border !border-zinc-600 !shadow-none"
            : "!bg-gray-200 !text-gray-800 hover:!bg-gray-300 !border !border-gray-300 !shadow-none",
          cancelButton: isDark
            ? "!bg-zinc-800 !text-zinc-200 !border !border-zinc-700 hover:!bg-zinc-700 !shadow-none"
            : "!bg-gray-100 !text-gray-700 !border !border-gray-300 hover:!bg-gray-200 !shadow-none",
          closeButton: isDark
            ? "!bg-zinc-800 !text-zinc-200 hover:!bg-zinc-700 !border !border-zinc-700 !shadow-none"
            : "!bg-gray-100 !text-gray-700 hover:!bg-gray-200 !border !border-gray-300 !shadow-none",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
