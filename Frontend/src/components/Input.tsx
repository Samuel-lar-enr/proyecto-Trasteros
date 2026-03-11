import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string,
  error?: string
}

export default function Input({label, error, id, className="", ...props}: InputProps) {
  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      {
        label && <label htmlFor={id}>{label}</label>
      }
      <input id={id} className={className} {...props} />
      {
        error && <p className="error-text">{error}</p>
      }
    </div>
  )
}