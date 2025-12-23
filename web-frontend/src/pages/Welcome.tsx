import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Welcome() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 延迟显示动画
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    navigate('/platform')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景粒子效果 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
        `
      }} />

      {/* 语言切换按钮 */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => i18n.changeLanguage('zh')}
          style={{
            padding: '8px 16px',
            background: i18n.language === 'zh' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          中文
        </button>
        <button
          onClick={() => i18n.changeLanguage('en')}
          style={{
            padding: '8px 16px',
            background: i18n.language === 'en' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          English
        </button>
      </div>

      {/* 主要内容 */}
      <div style={{
        textAlign: 'center',
        zIndex: 1,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s ease',
        width: '90%', // 限制整体内容宽度，避免过宽
        maxWidth: '1200px' // 最大宽度
      }}>
        {/* 盾牌Logo */}
        <div style={{
          marginBottom: '40px',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))'
            }}
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
        </div>

        {/* 标题 - 重点调整部分 */}
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)', // 响应式字体大小，根据屏幕宽度自适应
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #10b981)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 auto 20px', // 居中并设置底部间距
          textShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
          textAlign: 'center', // 明确居中
          lineHeight: 1.2, // 调整行高，避免多行时过于松散
          maxWidth: '90%', // 限制最大宽度，避免过长
          wordBreak: 'normal', // 正常断词
          whiteSpace: 'normal' // 允许自动换行
        }}>
          {t('welcome.title')}
        </h1>

        {/* 副标题 */}
        <p style={{
          fontSize: '1.5rem',
          color: '#94a3b8',
          marginBottom: '40px',
          maxWidth: '600px',
          lineHeight: 1.6,
          marginLeft: 'auto', // 水平居中
          marginRight: 'auto'
        }}>
          {t('welcome.subtitle')}
        </p>

        {/* 功能卡片 */}
        <div style={{
          display: 'flex',
          gap: '30px',
          justifyContent: 'center',
          marginBottom: '50px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '30px',
            width: '200px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '15px'
            }}>🎓</div>
            <h3 style={{
              color: '#3b82f6',
              marginBottom: '10px',
              fontSize: '1.2rem'
            }}>{t('welcome.teachTitle')}</h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              lineHeight: 1.4
            }}>{t('welcome.teachDesc')}</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '30px',
            width: '200px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '15px'
            }}>🔍</div>
            <h3 style={{
              color: '#8b5cf6',
              marginBottom: '10px',
              fontSize: '1.2rem'
            }}>{t('welcome.auditTitle')}</h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              lineHeight: 1.4
            }}>{t('welcome.auditDesc')}</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '30px',
            width: '200px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '15px'
            }}>🔧</div>
            <h3 style={{
              color: '#10b981',
              marginBottom: '10px',
              fontSize: '1.2rem'
            }}>{t('welcome.fixTitle')}</h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              lineHeight: 1.4
            }}>{t('welcome.fixDesc')}</p>
          </div>
        </div>

        {/* 进入按钮 */}
        <button
          onClick={handleEnter}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none',
            color: 'white',
            padding: '16px 40px',
            borderRadius: '50px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)'
          }}
        >
          {t('welcome.enterButton')}
          <span style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'transform 0.3s ease'
          }}>→</span>
        </button>

        {/* 底部信息 */}
        <div style={{
          marginTop: '60px',
          color: '#64748b',
          fontSize: '0.9rem'
        }}>
          <p>{t('welcome.footer')}</p>
        </div>
      </div>

      {/* CSS动画 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}