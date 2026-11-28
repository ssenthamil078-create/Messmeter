import { Header } from "@/components/header"
import { FoodieWagonDashboard } from "@/components/foodie-wagon-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <FoodieWagonDashboard />
    </main>
  )
}
