"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Xmark, MapPin } from "iconoir-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <span className="size-12 md:size-14 overflow-hidden rounded-full border-2 border-primary bg-white shadow-md">
              <img
                src="/messmeter-logo.png"
                alt="MessMeter chef logo"
                className="size-full object-cover object-[50%_42%]"
              />
            </span>
            <div className="hidden sm:block">
              <h1 className="text-primary font-bold text-xl md:text-2xl tracking-wider">MessMeter</h1>
              <p className="text-muted-foreground text-xs tracking-widest">STUDENT MEAL CHECK-IN</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="MessMeter navigation" className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium tracking-wide">
              Home
            </Link>
            <Link href="#menu" className="text-foreground hover:text-primary transition-colors font-medium tracking-wide text-sm">
              Student-Check in
            </Link>
            <Link href="#location" className="text-foreground hover:text-primary transition-colors font-medium tracking-wide">
              Kitchen
            </Link>
            <div className="flex items-center gap-2 text-accent" aria-label="Kitchen location">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <Xmark className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                href="#menu"
                className="text-foreground hover:text-primary transition-colors font-medium tracking-wide py-2"
                onClick={() => setIsOpen(false)}
              >
                Speisekarte
              </Link>
              <Link
                href="#location"
                className="text-foreground hover:text-primary transition-colors font-medium tracking-wide py-2"
                onClick={() => setIsOpen(false)}
              >
                Standort
              </Link>
              <Link
                href="#contact"
                className="text-foreground hover:text-primary transition-colors font-medium tracking-wide py-2"
                onClick={() => setIsOpen(false)}
              >
                Kontakt
              </Link>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-accent">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-medium">Ingolstadt</span>
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
