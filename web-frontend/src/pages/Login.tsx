import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('user')
  const [password, setPassword] = useState('user123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post('/api/auth/login', {
        username,
        password,
      })
      const token = data.access_token as string
      // 获取当前用户信息
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const meResp = await axios.get('/api/auth/me')
      const user = meResp.data

      localStorage.setItem('authToken', token)
      localStorage.setItem('currentUser', JSON.stringify(user))

      navigate('/platform')
    } catch (err: any) {
      // 根据不同的HTTP状态码显示不同的错误信息
      const statusCode = err?.response?.status
      const errorDetail = err?.response?.data?.detail || err?.message || '登录失败，请检查用户名和密码'
      
      let errorMsg = errorDetail
      
      // 根据状态码显示不同的错误提示
      if (statusCode === 404) {
        // 账号不存在
        errorMsg = '账号不存在，请注册'
      } else if (statusCode === 401) {
        // 密码错误（已包含剩余次数信息）
        errorMsg = errorDetail
      } else if (statusCode === 423) {
        // 账号锁定
        errorMsg = errorDetail
      } else if (statusCode === 503) {
        // 数据库连接失败
        errorMsg = errorDetail
      }
      
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (type: 'user' | 'admin') => {
    if (type === 'user') {
      setUsername('user')
      setPassword('user123')
    } else {
      setUsername('admin')
      setPassword('admin123')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top, #1f2933 0, #020617 45%, #000000 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(15,23,42,0.95)',
          borderRadius: 16,
          padding: 28,
          boxShadow:
            '0 20px 40px rgba(15,23,42,0.8), 0 0 0 1px rgba(148,163,184,0.2)',
          border: '1px solid rgba(148,163,184,0.35)',
        }}
      >
        <h2
          style={{
            color: '#e5e7eb',
            fontSize: 22,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {t('login.title')}
        </h2>
        <p
          style={{
            color: '#9ca3af',
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 18,
          }}
        >
          {t('login.subtitle')}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => quickFill('user')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 999,
              border: '1px solid rgba(59,130,246,0.6)',
              background: 'rgba(15,23,42,0.9)',
              color: '#e5e7eb',
              cursor: 'pointer',
            }}
          >
            {t('login.quickUser')}
          </button>
          <button
            type="button"
            onClick={() => quickFill('admin')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              borderRadius: 999,
              border: '1px solid rgba(251,113,133,0.8)',
              background:
                'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(249,115,22,0.15))',
              color: '#fecaca',
              cursor: 'pointer',
            }}
          >
            {t('login.quickAdmin')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            {t('login.username')}
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.7)',
              background: 'rgba(15,23,42,0.9)',
              color: '#e5e7eb',
              fontSize: 13,
              marginBottom: 12,
              outline: 'none',
            }}
          />

          <label
            style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            {t('login.password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.7)',
              background: 'rgba(15,23,42,0.9)',
              color: '#e5e7eb',
              fontSize: 13,
              marginBottom: 12,
              outline: 'none',
            }}
          />

          <div
            style={{
              fontSize: 12,
              color: '#9ca3af',
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            {t('login.hintUser')} <br />
            {t('login.hintAdmin')}
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.6)',
                color: '#fecaca',
                borderRadius: 8,
                padding: 8,
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 999,
              border: 'none',
              background: loading
                ? 'linear-gradient(90deg,#4b5563,#6b7280)'
                : 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
              color: '#f9fafb',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}









