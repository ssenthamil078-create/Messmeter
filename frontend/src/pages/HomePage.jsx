import PageHeader from '../components/PageHeader'
import StatusCard from '../components/StatusCard'

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Predicting how many students will eat each meal"
        subtitle="Students check in, the kitchen cooks the right amount."
      />
      <StatusCard />
    </>
  )
}
