import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { getNickname, isTourDone } from './lib/utils'
import { registerServiceWorker, requestNotificationPermission, setupPushSubscription } from './lib/notifications'
import { ConfigProvider, useConfig } from './context/ConfigContext'
import Onboarding from './components/Onboarding'
import OnboardingTour from './components/OnboardingTour'
import Home from './pages/Home'
import CreateBet from './pages/CreateBet'
import BetDetail from './pages/BetDetail'
import Leaderboard from './pages/Leaderboard'
import Vault from './pages/Vault'
import Admin from './pages/Admin'

// Wrap each page in a fade+slide transition
function PageTransition({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="anim-slide-up">
      {children}
    </div>
  )
}

function AppContent() {
  const [nickname, setNickname] = useState(getNickname())
  const [showTour, setShowTour] = useState(false)
  const config = useConfig()

  useEffect(() => {
    registerServiceWorker()
    if (nickname) {
      requestNotificationPermission().then(granted => {
        if (granted) setupPushSubscription(nickname)
      })
    }
  }, [nickname])

  function handleOnboardingDone(nick) {
    setNickname(nick)
    requestNotificationPermission().then(granted => {
      if (granted) setupPushSubscription(nick)
    })
    if (!isTourDone()) setShowTour(true)
  }

  if (!config.ready) return null
  if (!nickname) return <Onboarding onDone={handleOnboardingDone} />

  return (
    <BrowserRouter>
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateBet />} />
          <Route path="/bet/:id" element={<BetDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </PageTransition>
      {showTour && <OnboardingTour onDone={() => setShowTour(false)} />}
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  )
}
