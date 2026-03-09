import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Canaries from './pages/Canaries'
import Samples from './pages/Samples'
import Lab from './pages/Lab'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import LiveFeed from './components/LiveFeed'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/canaries" element={<Canaries />} />
              <Route path="/samples" element={<Samples />} />
              <Route path="/lab" element={<Lab />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          <LiveFeed />
        </div>
      </Layout>
    </BrowserRouter>
  )
}

export default App
