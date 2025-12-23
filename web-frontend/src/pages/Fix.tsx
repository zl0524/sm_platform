import { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import './fix.css'

export default function Fix() {
  const { t, i18n } = useTranslation()
  const [findingId, setFindingId] = useState('demo-id')
  const [language, setLanguage] = useState('PYTHON')
  const [source, setSource] = useState('')
  const [suggestion, setSuggestion] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  // === 初始化加载历史 ===
  useEffect(() => {
    const stored = localStorage.getItem('fixHistory')
    if (stored) setHistory(JSON.parse(stored))
    
    // 检查是否有从审计页面传递的数据
    const auditData = localStorage.getItem('auditToFix')
    if (auditData) {
      try {
        const data = JSON.parse(auditData)
        if (data.sourceCode) {
          setSource(data.sourceCode)
        }
        if (data.language) {
          setLanguage(data.language)
        }
        if (data.algorithm) {
          setFindingId(`audit-${data.algorithm}-${Date.now()}`)
        }
        // 清除传递的数据
        localStorage.removeItem('auditToFix')
      } catch (e) {
        console.error('Failed to parse audit data:', e)
      }
    }
  }, [])

  // === 保存历史 ===
  const saveHistory = (newRecord: any) => {
    const updated = [newRecord, ...history].slice(0, 10)
    setHistory(updated)
    localStorage.setItem('fixHistory', JSON.stringify(updated))
  }

  // === 删除单条历史 ===
  const deleteHistoryItem = (id: number) => {
    const updated = history.filter(item => item.id !== id)
    setHistory(updated)
    localStorage.setItem('fixHistory', JSON.stringify(updated))
  }

  // === 清空所有历史 ===
  const clearHistory = () => {
    if (window.confirm(t('fix.confirmClear'))) {
      setHistory([])
      localStorage.removeItem('fixHistory')
    }
  }

  const languageConfigs = {
    PYTHON: {
      name: t('fix.languagePython'),
      example: 'def sm4_encrypt(data, key):\n    iv = b"1234567890abcdef"\n    return sm4_cbc_encrypt(key, iv, data)'
    },
    C: {
      name: t('fix.languageC'),
      example: '#include <stdio.h>\nint main() {\n    unsigned char key[] = "1234567890abcdef";\n    return 0;\n}'
    },
    JAVA: {
      name: t('fix.languageJava'),
      example: 'public class Demo {\n  public static void main(String[] args) {\n    String key = "123456";\n  }\n}'
    }
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    setSource(languageConfigs[newLang as keyof typeof languageConfigs]?.example || '')
  }

  const run = async () => {
    setLoading(true)
    setSuggestion(null)
    try {
      const body = { findingId, language, sourceCode: source }
      const { data } = await axios.post('/api/fix/suggest', body)
      setSuggestion(data)
      
      // 保存到历史记录
      const newRecord = {
        id: Date.now(),
        findingId,
        language,
        source,
        suggestion: data,
        time: new Date().toLocaleString()
      }
      saveHistory(newRecord)
    } catch (e: any) {
      console.error('Fix suggestion error:', e)
      // 显示更详细的错误信息
      const errorMessage = e.response?.data?.detail || e.message || '生成修复建议时发生错误'
      alert(`修复建议生成失败: ${errorMessage}`)
      
      // 即使API失败，也显示一个默认的修复建议
      const fallbackSuggestion = {
        findingId,
        reason: "无法连接到修复服务，显示通用修复建议",
        suggestion: "请检查网络连接或稍后重试。如需手动修复，请参考以下通用建议：\n1. 避免硬编码密钥和IV\n2. 使用安全的随机数生成器\n3. 从安全的密钥管理系统获取密钥",
        codeSnippet: "# 通用修复示例\nimport os\niv = os.urandom(16)\n# 从环境变量获取密钥\nkey = os.environ.get('SM4_KEY')"
      }
      setSuggestion(fallbackSuggestion)
      
      // 也保存失败记录到历史
      const newRecord = {
        id: Date.now(),
        findingId,
        language,
        source,
        suggestion: fallbackSuggestion,
        time: new Date().toLocaleString()
      }
      saveHistory(newRecord)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = (item: any) => {
    setFindingId(item.findingId)
    setLanguage(item.language)
    setSource(item.source)
    setSuggestion(item.suggestion)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <h2 style={{
        color: '#60a5fa',
        borderBottom: '1px solid #2f3743',
        paddingBottom: 8,
        marginBottom: 20
      }}>
        {t('fix.title')}
      </h2>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {/* === 左侧主操作区 === */}
        <div style={{ flex: 2 }}>
          <div className="form-group">
            <label>{t('fix.findingId')}</label>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
              {t('fix.findingIdDesc')}
            </div>
            <input value={findingId} onChange={(e) => setFindingId(e.target.value)} />
          </div>

          <div className="form-group">
            <label>{t('fix.language')}</label>
            <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
              {Object.entries(languageConfigs).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('fix.source')}</label>
            <textarea rows={8} value={source} onChange={(e) => setSource(e.target.value)} />
          </div>

          <button className="run-btn" onClick={run} disabled={loading}>
            {loading ? t('fix.loading') : t('fix.run')}
          </button>

          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>{t('fix.thinking')}</span>
            </div>
          )}

          {suggestion && (
            <div className="result-card">
              <h3>{t('fix.resultTitle')}</h3>
              <p><strong>{t('fix.location')}:</strong> {suggestion.location || '未知'}</p>
              <p><strong>{t('fix.reason')}:</strong> {suggestion.reason}</p>
              <p><strong>{t('fix.suggestion')}:</strong></p>
              <pre className="suggestion-box">{suggestion.suggestion}</pre>
              <p><strong>{t('fix.codeSnippet')}:</strong></p>
              <pre className="code-box">{suggestion.codeSnippet}</pre>
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
            <h3 style={{ color: '#3b82f6' }}>{t('fix.historyTitle')}</h3>
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
                {t('fix.clearAll')}
              </button>
            )}
          </div>

          {history.length === 0 && <p style={{ color: '#9ba1a6' }}>{t('fix.noHistory')}</p>}
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
                title={t('fix.deleteRecord')}
              >
                ×
              </button>

              <div
                onClick={() => loadHistory(item)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ color: '#e6edf3', fontSize: '0.9rem' }}>
                  {item.findingId} | {item.language}
                </div>
                <div style={{ color: '#9ba1a6', fontSize: '0.8rem' }}>{item.time}</div>
                <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: 4 }}>
                  {t('fix.clickToLoad')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
