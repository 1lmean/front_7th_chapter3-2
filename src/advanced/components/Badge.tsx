import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "red" | "orange" | "yellow" | "green" | "blue";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

const variantClasses = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400 text-gray-900",
  green: "bg-green-500",
  blue: "bg-blue-500",
};

const positionClasses = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

export const Badge = ({
  children,
  variant = "red",
  position,
  className = "",
}: BadgeProps) => {
  const baseClasses = "text-white text-xs px-2 py-1 rounded";
  const positionClass = position ? `absolute ${positionClasses[position]}` : "";

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${positionClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
};

