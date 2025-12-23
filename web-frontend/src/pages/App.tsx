import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import './header.css'

export default function App() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [role, setRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  // 粒子动画背景
  useEffect(() => {
    const canvas = document.getElementById('particles') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: any[] = []
    const count = 40
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = 100
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5
      })
    }

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59,130,246,0.6)'
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      requestAnimationFrame(draw)
    }
    draw()
    return () => window.removeEventListener('resize', resize)
  }, [])

  // 读取当前登录用户
  useEffect(() => {
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      try {
        const data = JSON.parse(stored) as { username?: string; role?: string }
        setRole(data.role || null)
        setUsername(data.username || null)
      } catch {
        setRole(null)
        setUsername(null)
      }
    } else {
      setRole(null)
      setUsername(null)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    setRole(null)
    setUsername(null)
    navigate('/login')
  }

  return (
    <>
      <header>
        <canvas id="particles"></canvas>
        <div className="header-content">
          {/* 发光盾牌 Logo */}
          <div className="logo-container">
            <svg
              className="shield-logo"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="shieldGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path
                d="M32 4L8 12v16c0 16 10.667 28 24 32 13.333-4 24-16 24-32V12L32 4z"
                stroke="url(#shieldGradient)"
                strokeWidth="2.5"
                fill="rgba(59,130,246,0.1)"
              />
              <path
                d="M22 28l8 8 12-12"
                stroke="url(#shieldGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="platform-title">{t('appTitle')}</h1>
          </div>

          <nav>
            <NavLink to="/platform">{t('nav.teach')}</NavLink>
            <NavLink to="/audit">{t('nav.audit')}</NavLink>
            <NavLink to="/fix">{t('nav.fix')}</NavLink>
            {role === 'admin' && <NavLink to="/platform/admin">{t('nav.admin')}</NavLink>}
          </nav>

          <div className="lang-select">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
            {username ? (
              <>
                <span style={{ fontSize: 12, color: '#e5e7eb' }}>
                  {t('login.hello', { name: username, defaultValue: `${username}` })}
                  {role === 'admin' ? '（管理员）' : '（普通用户）'}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.8)',
                    background: 'transparent',
                    color: '#e5e7eb',
                    cursor: 'pointer',
                  }}
                >
                  {t('login.logout')}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  borderRadius: 999,
                  border: '1px solid rgba(59,130,246,0.8)',
                  background: 'transparent',
                  color: '#bfdbfe',
                  cursor: 'pointer',
                }}
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  )
}
