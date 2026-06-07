import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { getNickname, isTourDone } from './lib/utils'
import { registerServiceWorker, requestNotificationPermission } from './lib/notifications'
import { ConfigProvider, useConfig } from './context/ConfigContext'
import SplashScreen from './components/SplashScreen'
import Onboarding from './components/Onboarding'
import OnboardingTour from './components/OnboardingTour'
import Home from './pages/Home'
import CreateBet from './pages/CreateBet'
import BetDetail from './pages/BetDetail'
import Leaderboard from './pages/Leaderboard'
import Vault from './pages/Vault'
import Admin from './pages/Admin'

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)
  const [nickname, setNickname] = useState(getNickname())
  const [showTour, setShowTour] = useState(false)
  const config = useConfig()

  useEffect(() => {
    registerServiceWorker()
    if (nickname) requestNotificationPermission()
  }, [nickname])

  function handleOnboardingDone(nick) {
    setNickname(nick)
    requestNotificationPermission()
    if (!isTourDone()) setShowTour(true)
  }

  if (showSplash && config.ready) return <SplashScreen onDone={() => setShowSplash(false)} />
  if (!config.ready) return null
  if (!nickname) return <Onboarding onDone={handleOnboardingDone} />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateBet />} />
        <Route path="/bet/:id" element={<BetDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
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
