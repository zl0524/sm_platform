import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import axios from 'axios'
import './styles.css'
import './i18n'
import App from './pages/App'
import Welcome from './pages/Welcome'
import Teach from './pages/Teach'
import Audit from './pages/Audit'
import Fix from './pages/Fix'
import Login from './pages/Login'
import Admin from './pages/Admin'

// 从本地存储中恢复登录状态到 axios
const storedToken = localStorage.getItem('authToken')
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Welcome />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/platform',
    element: <App />,
    children: [
      { index: true, element: <Teach /> },
      { path: 'audit', element: <Audit /> },
      { path: 'fix', element: <Fix /> },
      { path: 'admin', element: <Admin /> },
    ],
  },
  {
    path: '/audit',
    element: <App />,
    children: [{ index: true, element: <Audit /> }],
  },
  {
    path: '/fix',
    element: <App />,
    children: [{ index: true, element: <Fix /> }],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
