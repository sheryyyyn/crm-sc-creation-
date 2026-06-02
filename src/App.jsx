import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginGate from './components/layout/LoginGate'
import useStore from './store/useStore'
import { signIn } from './firebase'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Projets from './pages/Projets'
import Taches from './pages/Taches'
import RDV from './pages/RDV'
import Documents from './pages/Documents'
import Finances from './pages/Finances'
import Depenses from './pages/Depenses'
import Parametres from './pages/Parametres'
import Formulaires from './pages/Formulaires'
import FormulairePublic from './pages/FormulairePublic'
import CalendrierEditorial from './pages/CalendrierEditorial'
import Mediatheque from './pages/Mediatheque'
import MotDePasse from './pages/MotDePasse'

export default function App() {
  const initListeners = useStore((s) => s.initListeners)

  useEffect(() => {
    let cleanup
    signIn().then(() => {
      initListeners().then((unsub) => { cleanup = unsub })
    })
    return () => cleanup?.()
  }, [])

  return (
    <Routes>
      {/* Page publique — sans sidebar */}
      <Route path="/formulaire" element={<FormulairePublic />} />

      {/* CRM — avec sidebar + protection mot de passe */}
      <Route path="*" element={
        <LoginGate>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/projets" element={<Projets />} />
              <Route path="/taches" element={<Taches />} />
              <Route path="/rdv" element={<RDV />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/depenses" element={<Depenses />} />
              <Route path="/formulaires" element={<Formulaires />} />
              <Route path="/calendrier-editorial" element={<CalendrierEditorial />} />
              <Route path="/mots-de-passe" element={<MotDePasse />} />
              <Route path="/parametres" element={<Parametres />} />
            </Routes>
          </Layout>
        </LoginGate>
      } />
    </Routes>
  )
}
