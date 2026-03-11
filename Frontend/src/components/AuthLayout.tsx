import React from 'react'

type AuthLayoutProps = {
  children: React.ReactNode,
  encabezado?: string,
  titulo: string,
  subtitulo?: string
}

export default function AuthLayout({children, encabezado, titulo, subtitulo}: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        {
          encabezado && <p className="eyebrow">{encabezado}</p>
        }
        <h1>{titulo}</h1>
        {
          subtitulo && <p className="subtitle">{subtitulo}</p>
        }
        {children}
      </section>
    </main>
  )
}