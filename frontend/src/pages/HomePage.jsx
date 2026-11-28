import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChefHat, Clock3, Leaf, Menu, ShieldCheck, X } from 'lucide-react'
import { HOME_BY_ROLE } from '../context/roles'
import { useAuth } from '../context/useAuth'

const meals = [
  { src: '/images/messmeter-thali.png', name: "Today's thali" },
  { src: '/images/messmeter-biryani.png', name: 'Biryani day' },
  { src: '/images/messmeter-breakfast.png', name: 'Breakfast special' },
]

const features = [
  {
    icon: Check,
    title: 'One-tap meal check-in',
    description: 'Students confirm or skip breakfast, lunch, and dinner before the kitchen cut-off.',
    color: 'mint',
  },
  {
    icon: ChefHat,
    title: 'A calmer kitchen',
    description: 'See live headcounts and turn confirmed meals into clear prep targets for every dish.',
    color: 'blue',
  },
  {
    icon: ShieldCheck,
    title: 'Simple admin control',
    description: 'Set menus, portion sizes, and deadlines. Keep accounts and daily operations in one place.',
    color: 'violet',
  },
]

export default function HomePage() {
  const { user, logout } = useAuth()
  const [mealIndex, setMealIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMealIndex(Math.floor(Math.random() * meals.length))
  }, [])

  const dashboardPath = user ? HOME_BY_ROLE[user.role] || '/student' : '/login'

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f4] text-[#142b25]">
      <header className="relative z-20 border-b border-white/10 bg-[#064f3e] text-white">
        <nav aria-label="Main navigation" className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="MessMeter home">
            <img src="/images/messmeter-logo.png" alt="MessMeter" className="h-11 w-auto object-contain" />
            <span className="font-display text-2xl tracking-tight">MessMeter</span>
          </a>

          <div className="hidden items-center gap-9 text-sm text-white/75 md:flex">
            <a className="text-white" href="#top">Home</a>
            <a className="transition hover:text-white" href="#features">How it works</a>
            <a className="transition hover:text-white" href="#impact">Our impact</a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <span className="text-xs text-white/80">
                  {user.name} ({user.role})
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm text-white/80 transition hover:text-white"
                >
                  Log out
                </button>
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d1f06b] px-5 py-2.5 text-sm font-semibold text-[#123b2f] transition hover:bg-[#c2e65b]"
                >
                  Open Dashboard <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link className="text-sm text-white/80 transition hover:text-white" to="/login">
                  Login
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#d1f06b] px-5 py-2.5 text-sm font-semibold text-[#123b2f] transition hover:bg-[#c2e65b]"
                >
                  Get started <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="absolute inset-x-0 top-full flex flex-col gap-4 border-t border-white/10 bg-[#064f3e] px-6 py-5 text-sm md:hidden">
            <a href="#top" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#impact" onClick={() => setMenuOpen(false)}>Our impact</a>
            <Link to={dashboardPath} onClick={() => setMenuOpen(false)} className="font-semibold text-[#d1f06b]">
              {user ? 'Open Dashboard' : 'Login'}
            </Link>
          </div>
        )}
      </header>

      <section
        id="top"
        className="relative mx-auto grid min-h-[590px] max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.08fr_0.92fr] md:gap-2 lg:min-h-[650px] lg:py-16"
      >
        <div className="relative z-10 max-w-[610px] py-5 lg:py-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce8d7] bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#35694d] shadow-sm">
            <span className="size-2 rounded-full bg-[#69b77d]" /> LESS WASTE. BETTER MEALS.
          </div>
          <h1 className="font-display text-[clamp(3.25rem,7vw,6.2rem)] leading-[0.96] tracking-[-0.04em] text-[#123d30]">
            Good food.
            <br />
            Just the <span className="text-[#16815f]">right amount.</span>
          </h1>
          <p className="mt-6 max-w-[490px] text-base leading-7 text-[#52675e] sm:text-lg sm:leading-8">
            A smarter hostel mess starts with one simple check-in. Know who&apos;s eating, cook what you need, and make every meal count.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={dashboardPath}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#076148] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(6,79,62,0.16)] transition hover:bg-[#064f3e]"
            >
              {user ? 'Go to Dashboard' : 'Explore MessMeter'} <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="rounded-full px-4 py-3 text-sm font-semibold text-[#35694d] transition hover:bg-white"
            >
              See how it works
            </a>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#61766b]">
            <span className="inline-flex items-center gap-2">
              <Check size={16} className="text-[#16815f]" /> Made for hostel life
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 size={16} className="text-[#16815f]" /> Ready before the cut-off
            </span>
          </div>
        </div>

        <div className="relative mx-auto flex aspect-square w-full max-w-[540px] items-center justify-center lg:ml-auto">
          <div className="absolute inset-[8%] rounded-full border border-[#d9e7d8]" />
          <div className="absolute inset-[18%] rounded-full border border-dashed border-[#c9ddc9]" />
          <div className="absolute left-[11%] top-[25%] size-3 rounded-full bg-[#e5b45c] shadow-[0_0_0_8px_rgba(229,180,92,0.12)]" />
          <div className="absolute right-[13%] top-[18%] size-2 rounded-full bg-[#80b990] shadow-[0_0_0_7px_rgba(128,185,144,0.14)]" />
          <div className="absolute bottom-[17%] right-[12%] size-3 rounded-full bg-[#9c8bc8] shadow-[0_0_0_8px_rgba(156,139,200,0.12)]" />
          <div className="relative flex aspect-square w-[84%] items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_45%,#e5eee0_0%,#d7e6d6_52%,#c7d9c7_100%)] shadow-[0_34px_70px_rgba(23,72,49,0.13)]">
            <div className="absolute inset-[9%] rounded-full border border-white/70" />
            <div className="absolute inset-[17%] rounded-full bg-[#d5e2d2] shadow-[inset_0_8px_20px_rgba(53,89,57,0.08)]" />
            <div className="absolute bottom-[14%] left-[19%] right-[19%] h-[12%] rounded-[50%] bg-[#56745c]/20 blur-xl" />
            <div className="mm-plate-spin relative z-10 aspect-square w-[88%]" aria-label={meals[mealIndex].name}>
              <img
                src={meals[mealIndex].src}
                alt={meals[mealIndex].name}
                className="h-full w-full rounded-full object-cover drop-shadow-[0_20px_18px_rgba(47,54,38,0.2)]"
              />
            </div>
          </div>
          <div className="absolute bottom-[9%] left-[1%] rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_12px_35px_rgba(33,65,43,0.12)] backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#74877c]">Today&apos;s menu</p>
            <p className="mt-1 text-sm font-semibold text-[#1b4434]">{meals[mealIndex].name}</p>
          </div>
          <div className="absolute right-[0%] top-[16%] flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3.5 py-2.5 text-xs font-semibold text-[#35694d] shadow-[0_10px_28px_rgba(33,65,43,0.1)] backdrop-blur">
            <Leaf size={15} className="text-[#16815f]" /> Freshly planned
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-24">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16815f]">One smoother mess</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-[#123d30] sm:text-4xl">
              Everyone knows what&apos;s for dinner.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#61766b]">
            A simple flow from student check-in to kitchen prep, with less guesswork along the way.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description, color }, index) => (
            <article
              key={title}
              className="rounded-[22px] border border-[#e6ece4] bg-white p-6 shadow-[0_6px_24px_rgba(24,60,38,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(24,60,38,0.09)] sm:p-7"
            >
              <div
                className={`flex size-12 items-center justify-center rounded-2xl ${
                  color === 'mint'
                    ? 'bg-[#d9f5e6] text-[#087553]'
                    : color === 'blue'
                    ? 'bg-[#e3edff] text-[#365bb7]'
                    : 'bg-[#f0e7fa] text-[#8052a4]'
                }`}
              >
                <Icon size={22} />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b9b90]">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#173e30]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#61766b]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="impact"
        className="mx-5 mb-10 rounded-[28px] bg-[#064f3e] px-6 py-10 text-white sm:mx-8 sm:px-10 lg:mx-auto lg:mb-16 lg:max-w-7xl lg:px-14 lg:py-12"
      >
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8f0cf]">Better planning, by design</p>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              Less food left behind. More good meals shared.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
              When students share their plans before the cooking cut-off, kitchens can prepare closer to the real headcount—helping reduce waste without compromising on freshness.
            </p>
          </div>
          <div className="flex gap-8 md:gap-10">
            <div>
              <p className="font-display text-4xl text-[#d1f06b]">1 tap</p>
              <p className="mt-1 text-xs text-white/65">to check in</p>
            </div>
            <div>
              <p className="font-display text-4xl text-[#d1f06b]">3 meals</p>
              <p className="mt-1 text-xs text-white/65">planned daily</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pb-8 text-sm text-[#718178] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-lg text-[#174330]">
          <img src="/images/messmeter-logo.png" alt="MessMeter" className="h-9 w-auto object-contain" />
          <span>MessMeter</span>
        </Link>
        <p>Thoughtful meals start with a little planning.</p>
      </footer>
    </main>
  )
}
