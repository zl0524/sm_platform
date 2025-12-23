import { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function Audit() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [algorithm, setAlgorithm] = useState('SM4')
  const [language, setLanguage] = useState('PYTHON')
  const [code, setCode] = useState('def demo():\n    pass')
  const [enableLLM, setEnableLLM] = useState(true)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showFullCode, setShowFullCode] = useState(false)
  const [serverHistory, setServerHistory] = useState<any[]>([])
  const [serverLoading, setServerLoading] = useState(false)

  // === 初始化加载历史 ===
  useEffect(() => {
    const stored = localStorage.getItem('auditHistory')
    if (stored) setHistory(JSON.parse(stored))
  }, [])

  // === 从后端加载服务器审计历史 ===
  useEffect(() => {
    const fetchServerHistory = async () => {
      try {
        setServerLoading(true)
        const { data } = await axios.get('/api/audit/history', {
          params: { skip: 0, limit: 20 },
        })
        setServerHistory(data || [])
      } catch (e) {
        console.error('Load server audit history failed:', e)
      } finally {
        setServerLoading(false)
      }
    }
    fetchServerHistory()
  }, [])

  // === 保存历史 ===
  const saveHistory = (newRecord: any) => {
    const updated = [newRecord, ...history].slice(0, 10)
    setHistory(updated)
    localStorage.setItem('auditHistory', JSON.stringify(updated))
  }

  // === 删除单条历史 ===
  const deleteHistoryItem = (id: number) => {
    const updated = history.filter(item => item.id !== id)
    setHistory(updated)
    localStorage.setItem('auditHistory', JSON.stringify(updated))
  }

  // === 清空所有历史 ===
  const clearHistory = () => {
    if (window.confirm(t('audit.confirmClear'))) {
      setHistory([])
      localStorage.removeItem('auditHistory')
    }
  }

  // === 语言配置 ===
  const languageConfigs = {
    PYTHON: { name: 'Python', example: 'def demo():\n    pass' },
    JAVA: { name: 'Java', example: 'public class Demo {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}' },
    JAVASCRIPT: { name: 'JavaScript', example: 'function demo() {\n    // Your code here\n}' },
    TYPESCRIPT: { name: 'TypeScript', example: 'function demo(): void {\n    // Your code here\n}' },
    C: { name: 'C', example: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}' },
    'C++': { name: 'C++', example: '#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}' },
    GO: { name: 'Go', example: 'package main\n\nfunc main() {\n    // Your code here\n}' },
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    setCode(languageConfigs[newLang as keyof typeof languageConfigs]?.example || '')
  }

  // === 执行审计 ===
  const run = async () => {
    setLoading(true)
    setReport(null)

    try {
      const body = { algorithm, language, sourceCode: code, enableLLM }
      const { data } = await axios.post('/api/audit/run', body)
      setReport(data)

      const newRecord = {
        id: Date.now(),
        algorithm,
        language,
        enableLLM,
        code,
        report: data,
        time: new Date().toLocaleString()
      }
      saveHistory(newRecord)
    } catch (error) {
      console.error('Audit failed:', error)
      alert(t('audit.auditFailed'))
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = (item: any) => {
    setAlgorithm(item.algorithm)
    setLanguage(item.language)
    setEnableLLM(item.enableLLM)
    setCode(item.code)
    setReport(item.report)
  }

  // === 跳转到修复功能 ===
  const goToFix = () => {
    // 将当前审计数据保存到localStorage，供修复页面使用
    const auditData = {
      algorithm,
      language,
      sourceCode: code,
      report
    }
    localStorage.setItem('auditToFix', JSON.stringify(auditData))
    navigate('/fix')
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <h2 style={{
        color: '#60a5fa',
        borderBottom: '1px solid #2f3743',
        paddingBottom: 8,
        marginBottom: 20
      }}>
        {t('audit.title')}
      </h2>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {/* === 左侧主操作区 === */}
        <div style={{ flex: 2 }}>
          <label style={{ color: '#e6edf3', marginBottom: '8px', fontWeight: 'bold' }}>{t('audit.algorithm')}</label>
          <select 
            value={algorithm} 
            onChange={(e) => setAlgorithm(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'white',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
          >
            <option style={{ background: '#1c2128', color: 'white' }}>SM2</option>
            <option style={{ background: '#1c2128', color: 'white' }}>SM3</option>
            <option style={{ background: '#1c2128', color: 'white' }}>SM4</option>
          </select>

          <label style={{ color: '#e6edf3', marginBottom: '8px', fontWeight: 'bold' }}>{t('audit.language')}</label>
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'white',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
          >
            {Object.entries(languageConfigs).map(([key, cfg]) => (
              <option key={key} value={key} style={{ background: '#1c2128', color: 'white' }}>{cfg.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ color: '#e6edf3', fontWeight: 'bold' }}>{t('audit.code')}</label>
            <button
              onClick={() => setShowFullCode(!showFullCode)}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid #3b82f6',
                color: '#3b82f6',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showFullCode ? t('audit.hideFullCode') : t('audit.showFullCode')}
            </button>
          </div>
          
          {showFullCode ? (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                background: '#1c2128',
                border: '1px solid #2f3743',
                borderRadius: 8,
                width: '90%',
                height: '90%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #2f3743',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ color: '#e6edf3', margin: 0 }}>{t('audit.fullCodeView')}</h3>
                  <button
                    onClick={() => setShowFullCode(false)}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('audit.close')}
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: '#0d1117',
                    color: '#e6edf3',
                    border: 'none',
                    fontFamily: 'monospace',
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          ) : (
          <textarea
            rows={10}
            style={{
              width: '100%',
              backgroundColor: '#1c2128',
              color: '#e6edf3',
              border: '1px solid #2f3743',
              borderRadius: 6,
              fontFamily: 'monospace',
              padding: 10
            }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          )}

          {/* === 启用LLM & 按钮区域 === */}
          <div style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#1c2128',
              border: '1px solid #2f3743',
              padding: '6px 12px',
              borderRadius: 6,
              color: '#e6edf3'
            }}>
              <input
                type="checkbox"
                checked={enableLLM}
                onChange={(e) => setEnableLLM(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              {t('audit.enableLLM')}
            </label>

            <button
              onClick={run}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 18px',
                border: 'none',
                borderRadius: 8,
                background: loading
                  ? 'linear-gradient(90deg, #4b5563, #6b7280)'
                  : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: '0.3s'
              }}
            >
              {loading ? t('audit.loading') : t('audit.run')}
            </button>
          </div>

          {/* === 动态加载提示 === */}
          {loading && (
            <div style={{
              marginTop: 20,
              textAlign: 'center',
              color: '#9ba1a6',
              fontSize: '0.95rem'
            }}>
              <span className="dot-flash">{t('audit.thinking')}</span>
              <style>{`
                .dot-flash::after {
                  content: '';
                  display: inline-block;
                  width: 1em;
                  text-align: left;
                  animation: dots 1.5s steps(5, end) infinite;
                }
                @keyframes dots {
                  0%, 20% { content: ''; }
                  40% { content: '.'; }
                  60% { content: '..'; }
                  80%, 100% { content: '...'; }
                }
              `}</style>
            </div>
          )}

          {/* === 审计结果 === */}
          {report && (
            <div style={{
              marginTop: 30,
              background: '#0d1117',
              border: '1px solid #2f3743',
              borderRadius: 8,
              padding: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#3b82f6', margin: 0 }}>{t('audit.resultTitle')}</h3>
                <button
                  onClick={goToFix}
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {t('audit.goToFix')}
                </button>
              </div>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#e6edf3',
                fontFamily: 'monospace',
                lineHeight: 1.5,
                maxHeight: '480px',
                overflowY: 'auto'
              }}>
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* === 右侧历史记录 === */}
        <div style={{
          flex: 1,
          background: '#1c2128',
          border: '1px solid #2f3743',
          borderRadius: 8,
          padding: 12,
          maxHeight: '700px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <h3 style={{ color: '#3b82f6' }}>{t('audit.historyTitle')}</h3>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  background: 'none',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}>
                {t('audit.clearAll')}
              </button>
            )}
          </div>

          {history.length === 0 && <p style={{ color: '#9ba1a6' }}>{t('audit.noHistory')}</p>}
          {history.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#0d1117',
                border: '1px solid #2f3743',
                borderRadius: 6,
                padding: 10,
                marginBottom: 10,
                position: 'relative'
              }}
            >
              <button
                onClick={() => deleteHistoryItem(item.id)}
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 8,
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title={t('audit.deleteRecord')}
              >
                ×
              </button>

              <div
                onClick={() => loadHistory(item)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ color: '#e6edf3', fontSize: '0.9rem' }}>
                  {item.algorithm} | {item.language}
                </div>
                <div style={{ color: '#9ba1a6', fontSize: '0.8rem' }}>{item.time}</div>
                <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: 4 }}>
                  {t('audit.clickToLoad')}
                </div>
              </div>
            </div>
          ))}

          {/* === 服务器审计历史（来自数据库） === */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 10,
              borderTop: '1px dashed #374151',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <h3 style={{ color: '#3b82f6', fontSize: '0.95rem', margin: 0 }}>
                服务器审计历史
              </h3>
              {serverLoading && (
                <span style={{ color: '#9ba1a6', fontSize: 12 }}>加载中...</span>
              )}
            </div>

            {serverHistory.length === 0 && !serverLoading && (
              <p style={{ color: '#9ba1a6', fontSize: 12 }}>
                暂无服务器端历史记录。
              </p>
            )}

            {serverHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#020617',
                  border: '1px solid #111827',
                  borderRadius: 6,
                  padding: 8,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                <div style={{ color: '#e5e7eb' }}>
                  {item.algorithm} | {item.language}
                </div>
                <div style={{ color: '#9ca3af', marginTop: 2 }}>
                  {item.username ? `用户：${item.username} | ` : ''}
                  时间：{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                </div>
                <div style={{ color: '#60a5fa', marginTop: 4 }}>
                  总数 {item.totalFindings}，高危 {item.high}，中危 {item.medium}，低危 {item.low}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
