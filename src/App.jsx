import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { getNickname } from './lib/utils'
import { registerServiceWorker, requestNotificationPermission } from './lib/notifications'
import { ConfigProvider, useConfig } from './context/ConfigContext'
import SplashScreen from './components/SplashScreen'
import NicknameGate from './components/NicknameGate'
import Home from './pages/Home'
import CreateBet from './pages/CreateBet'
import BetDetail from './pages/BetDetail'
import Leaderboard from './pages/Leaderboard'
import Vault from './pages/Vault'
import Admin from './pages/Admin'

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)
  const [nickname, setNickname] = useState(getNickname())
  const config = useConfig()

  useEffect(() => {
    registerServiceWorker()
    if (nickname) requestNotificationPermission()
  }, [nickname])

  if (showSplash && config.ready) return <SplashScreen onDone={() => setShowSplash(false)} />
  if (!config.ready) return null

  if (!nickname) return <NicknameGate onSet={setNickname} />

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
