import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initApiBase } from './lib/apiBase'
import { applyStoredPreferences } from './lib/preferences'

function boot() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// La police se règle avant le premier affichage : l'arbitrage de l'adresse attend une
// réponse du réseau, et voir les caractères grandir après coup trahirait le réglage.
applyStoredPreferences()

// L'adresse de l'API s'arbitre avant le premier rendu : les écrans demandent leurs données
// dès leur montage, et une page montée sur la mauvaise adresse l'ignore elle-même. Une
// erreur de lecture du réglage (navigation privée, stockage coupé) ne doit pas empêcher
// l'application de démarrer — on garde alors la base embarquée au build.
initApiBase().catch(() => undefined).then(boot)
