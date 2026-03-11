import React from 'react'

type CardProps = {
  children: React.ReactNode,
  className?: string,
  variant?: "auth" | "dashboard" | "centered"
}
  
export default function Card({children, className = "", variant = "auth"}: CardProps) {
  return <section className={`${variant}-card ${className}`}>{children}</section>
}