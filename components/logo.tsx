import type { FC } from "react"
import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export const Logo: FC<LogoProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  }

  return (
    <div className={`${className}`}>
      <Image
        src="/images/logo.png"
        alt="Cafe PON"
        width={200}
        height={68}
        className={`${sizeClasses[size]} w-auto object-contain`}
        priority
      />
    </div>
  )
}
