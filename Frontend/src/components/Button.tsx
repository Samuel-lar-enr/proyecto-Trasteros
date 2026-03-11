import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary',
  isLoading?: boolean,
  children: React.ReactNode
}

export default function Button({variant="primary", isLoading=false, children, className="", disabled, ...props}: ButtonProps) {

  const baseClass = variant === 'primary' ? 'primary-btn' : 'secondary-btn'

  return (
    <button className={`${baseClass} ${className}`} disabled={disabled || isLoading} {...props}>
      {
        isLoading
        ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }} />
            <span>Cargando...</span>
          </div>
        ) : children
      }
    </button>
  )
}