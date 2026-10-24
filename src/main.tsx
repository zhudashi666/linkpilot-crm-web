import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { AppLayout } from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Customers from './pages/Customers'
import Pipeline from './pages/Pipeline'
import Tasks from './pages/Tasks'
import Campaigns from './pages/Campaigns'
import Sop from './pages/Sop'
import Links from './pages/Links'
import AiCustomer from './pages/AiCustomer'
import Knowledge from './pages/Knowledge'
import AiActions from './pages/AiActions'
import Accounts from './pages/Accounts'
import Analytics from './pages/Analytics'
import SettingsPage from './pages/Settings'
import Billing from './pages/Billing'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="customers" element={<Customers />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="sop" element={<Sop />} />
          <Route path="links" element={<Links />} />
          <Route path="ai/agents" element={<AiCustomer />} />
          <Route path="ai/agents/:id" element={<Navigate to="/ai/agents" replace />} />
          <Route path="ai/knowledge" element={<Knowledge />} />
          <Route path="ai/actions" element={<AiActions />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
