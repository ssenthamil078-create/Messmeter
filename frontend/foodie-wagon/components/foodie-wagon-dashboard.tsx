"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, X, ArrowDown } from "lucide-react"

const meals = [
  {
    id: "breakfast",
    badge: "BREAKFAST",
    title: "Breakfast - 2026-11-26",
    cutOff: "10:10 am",
    items: [
      ["Idli", "4 pcs"],
      ["Medu Vada", "1 pc"],
      ["Sambar", "0.15 L"],
      ["Coconut Chutney", ""],
      ["Filter Coffee", ""],
    ],
  },
  {
    id: "lunch",
    badge: "LUNCH",
    title: "Lunch - 2026-11-26",
    cutOff: "12:10 pm",
    items: [
      ["Steamed Basmati Rice", "0.25 kg"],
      ["South Indian Sambar", ""],
      ["Vegetable Kurma", "0.12 kg"],
      ["Curd / Buttermilk", ""],
      ["Appalam", ""],
    ],
  },
  {
    id: "dinner",
    badge: "DINNER",
    title: "Dinner - 2026-11-26",
    cutOff: "05:10 pm",
    items: [
      ["Chapati", "3 pcs"],
      ["Paneer Butter Masala", "0.15 kg"],
      ["Jeera Rice", "0.15 kg"],
      ["Yellow Dal Tadka", "0.12 L"],
      ["Gulab Jamun", ""],
    ],
  },
]

type Choice = "Eating" | "Skipping"

export function FoodieWagonDashboard() {
  const [choices, setChoices] = useState<Record<string, Choice | undefined>>({})

  function setChoice(mealId: string, choice: Choice) {
    setChoices((current) => ({ ...current, [mealId]: choice }))
  }

  return (
    <>
      <section className="relative min-h-[620px] overflow-hidden bg-black pt-24 md:min-h-[700px] md:pt-28">
        <div aria-hidden="true" className="absolute left-[8%] top-1/4 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-10 right-[10%] size-80 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="relative z-10 order-2 text-center md:order-1 md:text-left">
            <p className="mb-5 inline-flex rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold tracking-[0.2em] text-primary">
              THE MESSMETER - REDUCE WASTE
            </p>
            <h1 className="font-sans text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-primary">TODAY&apos;S MEAL</span>
              <br />
              <span className="text-foreground">CHECK-IN</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:mx-0 md:text-xl">
              Welcome to The MessMeter. Tap Eating or Skipping for each meal before its cut-off time.
            </p>
            <a
              href="#menu"
              onClick={(event) => {
                event.preventDefault()
                document.getElementById("menu")?.scrollIntoView({
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
                  block: "start",
                })
              }}
              className="mt-8 inline-flex items-center gap-3 rounded-lg bg-primary px-7 py-4 font-bold tracking-wide text-primary-foreground shadow-xl shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              VIEW TODAY&apos;S MENU <ArrowDown aria-hidden="true" size={19} />
            </a>
          </div>

          <div className="order-1 flex items-center justify-center md:order-2">
            <div className="relative aspect-square w-full max-w-[520px]">
              <div aria-hidden="true" className="absolute inset-8 rounded-full bg-primary/15 blur-3xl" />
              <Image
                src="/indian-food-feature.png"
                alt="Indian thali with butter chicken, basmati rice, naan and chutneys"
                fill
                priority
                sizes="(max-width: 768px) 90vw, 520px"
                className="relative z-10 object-contain drop-shadow-[0_0_55px_rgba(251,191,36,0.24)] animate-float"
                style={{
                  borderStyle: "none",
                  borderWidth: "5px",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="scroll-mt-24 bg-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-[0.2em] text-primary">FRESH FROM OUR KITCHEN</p>
              <h2 className="font-sans text-4xl font-black uppercase tracking-tight text-primary sm:text-5xl">Today&apos;s Menu</h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Your meal plan for Thursday, November 26. Choose a response for breakfast, lunch, and dinner.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {meals.map((meal) => {
              const choice = choices[meal.id]
              return (
                <article key={meal.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20 transition-transform hover:-translate-y-1">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary/15 px-4 py-2 text-sm font-black tracking-wider text-primary">{meal.badge}</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                      <span aria-hidden="true" className="size-2 rounded-full bg-emerald-400" />
                      Check-in Open
                    </span>
                  </div>

                  <h3 className="font-sans text-2xl font-bold leading-snug text-foreground">{meal.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Cut-off deadline: <span className="font-semibold text-foreground">{meal.cutOff}</span></p>

                  <div className="my-5 border-t border-border" />
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Today&apos;s Menu</h4>
                  <ul className="flex-1 space-y-3 text-base text-foreground/90">
                    {meal.items.map(([name, quantity]) => (
                      <li key={name} className="flex items-start justify-between gap-3">
                        <span className="flex gap-2"><span aria-hidden="true" className="text-primary">•</span>{name}</span>
                        {quantity && <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">{quantity}</span>}
                      </li>
                    ))}
                  </ul>

                  <div className="my-5 border-t border-border" />
                  <p className="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                    Your Current Status:
                    <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-foreground">{choice ?? "No response yet"}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setChoice(meal.id, "Eating")} aria-pressed={choice === "Eating"} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/70 bg-emerald-500/10 px-3 py-3 font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 aria-pressed:bg-emerald-500/25">
                      <Check aria-hidden="true" size={18} /> Eating
                    </button>
                    <button type="button" onClick={() => setChoice(meal.id, "Skipping")} aria-pressed={choice === "Skipping"} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/70 bg-amber-500/10 px-3 py-3 font-bold text-amber-300 transition-colors hover:bg-amber-500/20 aria-pressed:bg-amber-500/25">
                      <X aria-hidden="true" size={18} /> Skipping
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="location" className="border-t border-border bg-card py-10" aria-label="Location" />
    </>
  )
}
