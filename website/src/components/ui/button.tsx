import * as React from "react"
import { cn } from "@/lib/utils/cn"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "default" | "lg" | "xl"
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
    
    const variantClasses = {
      default: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg",
      primary: "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
      secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300 border border-secondary-200",
      outline: "border-2 border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 active:bg-primary-100",
      ghost: "text-secondary-700 hover:bg-secondary-100 active:bg-secondary-200",
      destructive: "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-md hover:shadow-lg"
    }
    
    const sizeClasses = {
      sm: "h-9 px-3 text-sm",
      default: "h-11 px-6 text-base",
      lg: "h-12 px-8 text-lg",
      xl: "h-14 px-10 text-xl"
    }

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
