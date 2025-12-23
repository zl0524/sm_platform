import { useEffect, useState } from 'react'
import axios from 'axios'

interface CurrentUser {
  username: string
  role: string
}

interface AuditStatsPerAlgorithm {
  algorithm: string
  taskCount: number
  totalFindings: number
  high: number
  medium: number
  low: number
}

interface AuditStatsSummary {
  totalTasks: number
  totalFindings: number
  high: number
  medium: number
  low: number
  perAlgorithm: AuditStatsPerAlgorithm[]
}

export default function Admin() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AuditStatsSummary | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CurrentUser
        setUser(parsed)
      } catch {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('未登录或登录已过期，请先登录管理员账号。')
      return
    }
    axios
      .get('/api/auth/admin/ping', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setError(null)
        // 校验通过后再加载审计统计
        setStatsLoading(true)
        axios
          .get('/api/audit/stats/summary', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            setStats(res.data)
          })
          .catch(() => {
            // 统计失败不影响管理员页其余展示
          })
          .finally(() => {
            setStatsLoading(false)
          })
      })
      .catch(() => {
        setError('当前账号没有管理员权限。')
      })
  }, [])

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ color: '#f97373', marginBottom: 12 }}>管理员中心</h2>
        <div
          style={{
            background: '#1f2933',
            borderRadius: 8,
            padding: 16,
            border: '1px solid #ef4444',
            color: '#fecaca',
            maxWidth: 520,
          }}
        >
          {error}
          <div style={{ marginTop: 8, fontSize: 13, color: '#e5e7eb' }}>
            请返回登录页，使用管理员账号 <code>admin / admin123</code> 登录。
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#60a5fa', marginBottom: 12 }}>管理员中心</h2>
      <div
        style={{
          background: '#111827',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #1f2937',
          maxWidth: 720,
        }}
      >
        <div style={{ marginBottom: 16, color: '#e5e7eb' }}>
          <div>当前登录管理员：{user?.username || '未知'}</div>
          <div>角色：{user?.role || 'admin'}</div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 16,
          }}
        >
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(96,165,250,0.05))',
              borderRadius: 10,
              padding: 14,
              border: '1px solid rgba(59,130,246,0.4)',
            }}
          >
            <div style={{ color: '#bfdbfe', fontWeight: 600, marginBottom: 6 }}>
              模块访问管理（示例）
            </div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>
              在这里可以扩展：控制教学、审计、修复模块的访问权限，例如只允许已登录用户使用审计和修复功能。
            </div>
          </div>

          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(248,113,113,0.12), rgba(249,115,22,0.05))',
              borderRadius: 10,
              padding: 14,
              border: '1px solid rgba(248,113,113,0.4)',
            }}
          >
            <div style={{ color: '#fecaca', fontWeight: 600, marginBottom: 6 }}>
              审计规则 / 修复策略配置（预留）
            </div>
            <div style={{ color: '#fca5a5', fontSize: 13 }}>
              未来可以挂接到后端接口，例如开启/关闭某些审计规则，配置LLM增强开关等。
            </div>
          </div>

          {/* 审计统计概览 */}
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(5,150,105,0.06))',
              borderRadius: 10,
              padding: 14,
              border: '1px solid rgba(16,185,129,0.5)',
            }}
          >
            <div style={{ color: '#a7f3d0', fontWeight: 600, marginBottom: 6 }}>
              审计统计概览
            </div>
            {statsLoading && (
              <div style={{ color: '#6ee7b7', fontSize: 13 }}>正在加载统计数据...</div>
            )}
            {!statsLoading && !stats && (
              <div style={{ color: '#bbf7d0', fontSize: 13 }}>暂无统计数据或加载失败。</div>
            )}
            {!statsLoading && stats && (
              <div style={{ color: '#d1fae5', fontSize: 13 }}>
                <div style={{ marginBottom: 6 }}>
                  总审计次数：<strong>{stats.totalTasks}</strong>
                  <br />
                  总发现问题数：<strong>{stats.totalFindings}</strong>
                </div>
                <div style={{ marginBottom: 6 }}>
                  按严重程度汇总：
                  <br />
                  高危 <strong>{stats.high}</strong>，中危{' '}
                  <strong>{stats.medium}</strong>，低危 <strong>{stats.low}</strong>
                </div>
                {stats.perAlgorithm && stats.perAlgorithm.length > 0 && (
                  <div>
                    按算法分布：
                    <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                      {stats.perAlgorithm.map((item) => (
                        <li key={item.algorithm} style={{ marginBottom: 2 }}>
                          <span style={{ fontWeight: 600 }}>{item.algorithm}</span>：
                          任务 {item.taskCount}，发现 {item.totalFindings}（高
                          {item.high} / 中{item.medium} / 低{item.low}）
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}





