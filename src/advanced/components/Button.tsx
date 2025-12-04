import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  reverse?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  className?: string;
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-4 py-3 text-base",
};

export const Button = ({
  children,
  onClick,
  disabled = false,
  reverse = false,
  fullWidth = false,
  size = "md",
  type = "button",
  className = "",
}: ButtonProps) => {
  const baseClasses = "rounded-md font-medium transition-colors";
  const widthClass = fullWidth ? "w-full" : "";

  const variantClasses = disabled
    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
    : reverse
      ? "text-gray-600 hover:text-gray-900"
      : "bg-gray-900 text-white hover:bg-gray-800";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${widthClass} ${variantClasses} ${className}`.trim()}
    >
      {children}
    </button>
  );
};

