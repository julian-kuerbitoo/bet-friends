import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULTS = {
  app_name: 'BetFriends',
  accent_1: '#f97316',
  accent_2: '#ea580c',
  bg_top: '#0b1e2d',
  bg_bottom: '#0f0820',
  splash_emoji: '🏆',
}

const ConfigContext = createContext(DEFAULTS)

export function useConfig() {
  return useContext(ConfigContext)
}

function applyConfig(cfg) {
  const root = document.documentElement
  root.style.setProperty('--accent-1', cfg.accent_1)
  root.style.setProperty('--accent-2', cfg.accent_2)
  root.style.setProperty('--bg-top', cfg.bg_top)
  root.style.setProperty('--bg-bottom', cfg.bg_bottom)
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadConfig()

    const channel = supabase
      .channel('app-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, loadConfig)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function loadConfig() {
    const { data } = await supabase.from('app_config').select('key, value')
    if (!data) { setReady(true); return }
    const cfg = { ...DEFAULTS }
    for (const row of data) cfg[row.key] = row.value
    setConfig(cfg)
    applyConfig(cfg)
    setReady(true)
  }

  async function updateConfig(key, value) {
    await supabase.from('app_config').upsert({ key, value, updated_at: new Date().toISOString() })
  }

  return (
    <ConfigContext.Provider value={{ ...config, updateConfig, ready }}>
      {children}
    </ConfigContext.Provider>
  )
}
