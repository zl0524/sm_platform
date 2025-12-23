import { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

export default function Teach() {
  const { t, i18n } = useTranslation()
  const [algorithm, setAlgorithm] = useState('SM4')
  const [mode, setMode] = useState('encrypt') // 新增：加密/解密模式
  const [params, setParams] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [result, setResult] = useState<any>(null)
  const [paramExamples, setParamExamples] = useState<any>({})
  const [showFullJson, setShowFullJson] = useState(false) // 全局 JSON 折叠
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({}) // 每步折叠状态

  const getExamples = () => ({
    SM2: {
      encrypt: {
        title: t('teach.sm2EncryptTitle'),
        description: t('teach.sm2EncryptDesc'),
      examples: [
        {
            name: t('teach.sm2BasicSign'),
          params: '{"curve": "sm2p256v1", "keyLength": 256, "hashAlg": "SM3"}',
            desc: t('teach.sm2BasicSignDesc')
        },
        {
            name: t('teach.sm2KeyExchange'),
          params: '{"curve": "sm2p256v1", "keyLength": 256, "kdf": "SM3"}',
            desc: t('teach.sm2KeyExchangeDesc')
          }
        ]
      },
      decrypt: {
        title: t('teach.sm2DecryptTitle'),
        description: t('teach.sm2DecryptDesc'),
        examples: [
          {
            name: t('teach.sm2SignVerify'),
            params: '{"curve": "sm2p256v1", "keyLength": 256, "hashAlg": "SM3", "verify": true}',
            desc: t('teach.sm2SignVerifyDesc')
          },
          {
            name: t('teach.sm2KeyRecover'),
            params: '{"curve": "sm2p256v1", "keyLength": 256, "recover": true}',
            desc: t('teach.sm2KeyRecoverDesc')
          }
        ]
      }
    },
    SM3: {
      encrypt: {
        title: t('teach.sm3EncryptTitle'),
        description: t('teach.sm3EncryptDesc'),
      examples: [
        {
            name: t('teach.sm3Standard'),
          params: '{"blockSize": 512, "outputLength": 256, "rounds": 64}',
            desc: t('teach.sm3StandardDesc')
        },
        {
            name: t('teach.sm3CustomLength'),
          params: '{"blockSize": 512, "outputLength": 128, "truncate": true}',
            desc: t('teach.sm3CustomLengthDesc')
          }
        ]
      },
      decrypt: {
        title: t('teach.sm3DecryptTitle'),
        description: t('teach.sm3DecryptDesc'),
        examples: [
          {
            name: t('teach.sm3HashVerify'),
            params: '{"blockSize": 512, "outputLength": 256, "verify": true}',
            desc: t('teach.sm3HashVerifyDesc')
          },
          {
            name: t('teach.sm3Collision'),
            params: '{"blockSize": 512, "outputLength": 256, "collision": true}',
            desc: t('teach.sm3CollisionDesc')
          }
        ]
      }
    },
    SM4: {
      encrypt: {
        title: t('teach.sm4EncryptTitle'),
        description: t('teach.sm4EncryptDesc'),
      examples: [
        {
            name: t('teach.sm4CBCMode'),
          params:
            '{"mode": "CBC", "ivHex": "00112233445566778899AABBCCDDEEFF", "keyLength": 128, "blockSize": 16}',
            desc: t('teach.sm4CBCModeDesc')
        },
        {
            name: t('teach.sm4CTRMode'),
          params:
            '{"mode": "CTR", "counter": "00000000000000000000000000000001", "keyLength": 128}',
            desc: t('teach.sm4CTRModeDesc')
        },
        {
            name: t('teach.sm4ECBMode'),
          params:
            '{"mode": "ECB", "keyLength": 128, "blockSize": 16}',
            desc: t('teach.sm4ECBModeDesc')
          }
        ]
      },
      decrypt: {
        title: t('teach.sm4DecryptTitle'),
        description: t('teach.sm4DecryptDesc'),
        examples: [
          {
            name: t('teach.sm4CBCDecrypt'),
            params:
              '{"mode": "CBC", "ivHex": "00112233445566778899AABBCCDDEEFF", "keyLength": 128, "blockSize": 16, "decrypt": true}',
            desc: t('teach.sm4CBCDecryptDesc')
          },
          {
            name: t('teach.sm4CTRDecrypt'),
            params:
              '{"mode": "CTR", "counter": "00000000000000000000000000000001", "keyLength": 128, "decrypt": true}',
            desc: t('teach.sm4CTRDecryptDesc')
          },
          {
            name: t('teach.sm4ECBDecrypt'),
            params:
              '{"mode": "ECB", "keyLength": 128, "blockSize": 16, "decrypt": true}',
            desc: t('teach.sm4ECBDecryptDesc')
          }
        ]
      }
    }
  })

  // 切换算法或模式时重置参数与结果与展开状态
  useEffect(() => {
    const examples = getExamples()
    const algorithmExamples = examples[algorithm as keyof typeof examples]
    if (algorithmExamples && mode in algorithmExamples) {
      setParamExamples(algorithmExamples[mode as keyof typeof algorithmExamples])
    }
    setResult(null)
    setShowFullJson(false)
    setExpandedSteps({})
  }, [algorithm, mode, t])

  // 语言切换时更新默认参数
  useEffect(() => {
    if (!params || params === '{"在这里输入你想要的参数（可以参考示例）"}' || params === '{"Enter your desired parameters here (you can refer to examples)"}') {
      setParams(t('teach.defaultParamsExample'))
    }
  }, [t, params])

  const run = async () => {
    let parsedParams = {}
    try {
      parsedParams = JSON.parse(params || '{}')
    } catch (e) {
      // 如果用户传入非 JSON，后端也可接受字符串，这里尽量不抛错
      parsedParams = { raw: params }
    }

    if (customInput.trim()) {
      if (algorithm === 'SM4') {
        ;(parsedParams as any).plaintext = customInput.trim()
      } else {
        ;(parsedParams as any).message = customInput.trim()
      }
    }
    
    // 添加模式参数
    ;(parsedParams as any).mode = mode
    
    const body = { algorithm, params: parsedParams }
    const { data } = await axios.post('/api/teach/simulate', body)
    setResult(data)
    setShowFullJson(false)
    setExpandedSteps({})
  }

  // helper: 判断文本是否过长（用于折叠）
  const isTextTooLong = (text: string, charLimit = 6000, lineLimit = 200) => {
    if (!text) return false
    return text.length > charLimit || text.split('\n').length > lineLimit
  }

  // helper: 将任意 visualData 字段转换为显示文本
  const dataToText = (value: any) => {
    if (value == null) return ''
    if (typeof value === 'string') return value
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  // 全局原始 JSON 文本
  const jsonText = result ? JSON.stringify(result, null, 2) : ''
  const isJsonTooLong = isTextTooLong(jsonText, 10000, 300)
  const displayedJson =
    !isJsonTooLong || showFullJson
      ? jsonText
      : jsonText.split('\n').slice(0, 80).join('\n') + '\n' + t('teach.omittedText')

  // toggle 单步展开
  const toggleStep = (idx: number) => {
    setExpandedSteps((s) => ({ ...s, [idx]: !s[idx] }))
  }

  // 翻译步骤标题
  const translateStepTitle = (title: string) => {
    const translations: Record<string, string> = {
      'SM4 初始化': t('teach.sm4Init'),
      '初始化SM4算法，模式：encrypt，密钥长度：128位': t('teach.sm4InitEncrypt'),
      '初始化SM4算法，模式：decrypt，密钥长度：128位': t('teach.sm4InitDecrypt'),
      'SM2 密钥生成': t('teach.sm2KeyGen'),
      'SM3 哈希计算': t('teach.sm3HashCalc'),
      'SM4 加密': t('teach.sm4Encrypt'),
      'SM4 解密': t('teach.sm4Decrypt'),
      'SM2 签名': t('teach.sm2Sign'),
      'SM2 验证': t('teach.sm2Verify'),
      'SM3 验证': t('teach.sm3Verify'),
      '密钥扩展': t('teach.keyExpansion'),
      '分组处理': t('teach.blockProcessing'),
      '模式操作': t('teach.modeOperation'),
      'encrypt模式操作': t('teach.modeOperation')
    }
    return translations[title] || title
  }

  // 翻译步骤描述
  const translateStepDescription = (description: string) => {
    const translations: Record<string, string> = {
      '初始化SM4算法，模式：encrypt，密钥长度：128位': t('teach.sm4InitDesc'),
      '将128位密钥扩展为32个轮密钥': t('teach.keyExpansionDesc'),
      '对16字节分组进行加密/解密': t('teach.blockProcessingDesc'),
      '在encrypt模式下处理多个分组': t('teach.modeOperationDesc')
    }
    return translations[description] || description
  }

  // 翻译结果键名
  const translateResultKey = (key: string) => {
    const translations: Record<string, string> = {
      'plaintext': t('teach.resultPlaintext'),
      'ciphertext': t('teach.resultCiphertext'),
      'key': t('teach.resultKey'),
      'iv': t('teach.resultIV'),
      'signature': t('teach.resultSignature'),
      'hash': t('teach.resultHash'),
      'publicKey': t('teach.resultPublicKey'),
      'privateKey': t('teach.resultPrivateKey'),
      'verified': t('teach.resultVerified'),
      'mode': t('teach.resultMode'),
      'algorithm': t('teach.resultAlgorithm')
    }
    return translations[key] || key
  }

  // 翻译算法流程文本
  const translateFlowText = (text: string) => {
    const translations: Record<string, string> = {
      '初始化': t('teach.init'),
      '密钥扩展': t('teach.keyExpansionFlow'),
      '分组处理': t('teach.blockProcessingFlow'),
      '模式操作': t('teach.modeOperationFlow')
    }
    return translations[text] || text
  }

  return (
    <div>
      <h2 style={{ color: '#60a5fa', marginBottom: '20px' }}>{t('teach.title')}</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
    <div>
      <label style={{ color: '#e6edf3', marginBottom: '8px', fontWeight: 'bold', display: 'block' }}>{t('teach.algorithm')}</label>
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
          cursor: 'pointer'
        }}
      >
        <option style={{ background: '#1c2128', color: 'white' }}>SM2</option>
        <option style={{ background: '#1c2128', color: 'white' }}>SM3</option>
        <option style={{ background: '#1c2128', color: 'white' }}>SM4</option>
      </select>
        </div>
        
        <div>
          <label style={{ color: '#e6edf3', marginBottom: '8px', fontWeight: 'bold', display: 'block' }}>{t('teach.mode')}</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'white',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option style={{ background: '#1c2128', color: 'white' }} value="encrypt">{t('teach.encrypt')}</option>
            <option style={{ background: '#1c2128', color: 'white' }} value="decrypt">{t('teach.decrypt')}</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>{t('teach.params')}</label>
        <div style={{ fontSize: '14px', color: '#9ba1a6', marginBottom: 8 }}>
          {paramExamples.title}: {paramExamples.description}
        </div>
        <textarea
          rows={6}
          style={{ width: 420 }}
          value={params}
          onChange={(e) => setParams(e.target.value)}
          placeholder={t('teach.paramsPlaceholder')}
        />

        <div style={{ marginTop: 12 }}>
          <label>
            {mode === 'encrypt' 
              ? (algorithm === 'SM4' ? t('teach.customPlaintext') : t('teach.customMessage'))
              : (algorithm === 'SM4' ? t('teach.customCiphertext') : t('teach.customSignature'))
            }：
          </label>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={
              mode === 'encrypt'
                ? (algorithm === 'SM4' ? t('teach.placeholderEncryptPlaintext') : t('teach.placeholderEncryptMessage'))
                : (algorithm === 'SM4' ? t('teach.placeholderDecryptCiphertext') : t('teach.placeholderDecryptSignature'))
            }
            style={{ width: 420, padding: 8, marginTop: 4 }}
          />
          <div style={{ fontSize: '12px', color: '#9ba1a6', marginTop: 4 }}>
            💡 {mode === 'encrypt' 
              ? t('teach.customHint')
              : t('teach.customHintDecrypt')
            }
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <strong>{t('teach.exampleTitle')}：</strong>
          {paramExamples.examples?.map((example: any, index: number) => (
            <div
              key={index}
              style={{
                marginTop: 6,
                padding: 10,
                background: '#1c2128',
                border: '1px solid #2f3743',
                borderRadius: 6
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#60a5fa' }}>{example.name}</div>
              <div style={{ fontSize: '12px', color: '#9ba1a6', marginBottom: 4 }}>
                {example.desc}
              </div>
              <code
                style={{
                  fontSize: '11px',
                  background: '#0d1117',
                  padding: 6,
                  borderRadius: 4,
                  display: 'block',
                  color: '#c9d1d9',
                  overflowX: 'auto'
                }}
              >
                {example.params}
              </code>
              <button
                style={{ marginTop: 6, padding: '4px 10px', fontSize: '12px' }}
                onClick={() => setParams(example.params)}
              >
                {t('teach.useThisParam')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={run}>{t('teach.run')}</button>
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: '#60a5fa' }}>{t('teach.resultTitle')}</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'nowrap' }}>
            {/* 左侧：每一步展示（包含代码/visualData） */}
            <div style={{ flex: '1 1 50%', minWidth: 0 }}>
              <h4>{t('teach.stepTitle')}</h4>
              {result.steps?.map((step: any, index: number) => {
                // 尝试从 visualData 中提取常见代码/片段字段
                const vd = step.visualData || {}
                const possibleCodeFields = ['code', 'source', 'snippet', 'script', 'example']
                let codeText = ''
                for (const f of possibleCodeFields) {
                  if (vd[f]) {
                    codeText = dataToText(vd[f])
                    break
                  }
                }
                // 如果没有 code 字段，但 visualData 有其他对象，则 stringify
                if (!codeText && Object.keys(vd).length > 0) {
                  // 作为备用，显示整个 visualData
                  codeText = dataToText(vd)
                }

                const tooLong = isTextTooLong(codeText, 4000, 200)

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      border: '1px solid #2f3743',
                      borderRadius: 8,
                      background: '#161b22'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#e6edf3' }}>
                          {t('teach.step') ? t('teach.step', { index: index + 1 }) : `${t('teach.stepPrefix')} ${index + 1}`}： {translateStepTitle(step.title)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ba1a6', marginTop: 6 }}>
                          {translateStepDescription(step.description)}
                        </div>
                      </div>

                      {/* 若该步骤含有可折叠的代码/数据，显示 toggle 按钮 */}
                      {codeText ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => toggleStep(index)}
                            style={{
                              padding: '6px 10px',
                              fontSize: 12,
                              background: '#2b3138',
                              border: '1px solid #30363d',
                              color: '#e6edf3',
                              borderRadius: 6
                            }}
                          >
                            {expandedSteps[index] ? t('teach.hideDetails') : t('teach.showDetails')}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* 如果有 visualData/code，显示折叠区 */}
                    {codeText && expandedSteps[index] && (
                      <div style={{ marginTop: 10 }}>
                        <pre
                          style={{
                            background: '#0d1117',
                            color: '#c9d1d9',
                            padding: 10,
                            borderRadius: 6,
                            fontSize: '12px',
                            overflow: 'auto',
                            maxHeight: tooLong ? 320 : 'none',
                            position: 'relative'
                          }}
                        >
                          {tooLong && !expandedSteps[index]
                            ? codeText.split('\n').slice(0, 80).join('\n') + '\n' + t('teach.omittedTextShort')
                            : codeText}
                        </pre>

                        {/* 如果太长再提供显示全部/收起二级控制（展开后仍可能很长） */}
                        {tooLong && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <button
                              onClick={() =>
                                setExpandedSteps((s) => ({ ...s, [index]: true }))
                              }
                              style={{
                                padding: '6px 10px',
                                fontSize: 12,
                                borderRadius: 6
                              }}
                            >
                              {t('teach.expandAll')}
                            </button>
                            <button
                              onClick={() =>
                                setExpandedSteps((s) => ({ ...s, [index]: false }))
                              }
                              style={{
                                padding: '6px 10px',
                                fontSize: 12,
                                borderRadius: 6
                              }}
                            >
                              {t('teach.hideAll')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 如果没有 code，但有 visualData 且未展开，则可以显示一个简短摘要 */}
                    {codeText && !expandedSteps[index] && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#9ba1a6' }}>
                          {t('teach.stepContainsData')}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 右侧：算法流程与最终结果（上下排列） */}
            <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 算法流程图 */}
              <div>
                <h4>{t('teach.flowTitle')}</h4>
                <div
                  style={{
                    background: '#1c2128',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #2f3743',
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {result.steps?.map((step: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: index < result.steps.length - 1 ? 8 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <div
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {step.stepKey}
                      </div>
                      <div style={{ fontSize: '14px' }}>{translateFlowText(step.title)}</div>
                      {index < result.steps.length - 1 && (
                        <div style={{ fontSize: '20px', color: '#9ba1a6' }}>↓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 最终结果 */}
              {result.steps?.[result.steps.length - 1]?.visualData?.finalResult && (
                <div>
                  <h4>{t('teach.finalResult')}</h4>
                  <div
                    style={{
                      background: '#1c2128',
                      border: '1px solid #2f3743',
                      padding: 12,
                      borderRadius: 8
                    }}
                  >
                    {Object.entries(
                      result.steps[result.steps.length - 1].visualData.finalResult
                    )
                    .filter(([key]) => key !== 'verified') // 过滤掉verified列
                    .map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid #30363d'
                        }}
                      >
                        <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{translateResultKey(key)}:</span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: '#e6edf3',
                            wordBreak: 'break-all'
                          }}
                        >
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 全局原始 JSON 折叠区 */}
          <div style={{ position: 'relative', marginTop: 16 }}>
            <h4>{t('teach.viewRawJson')}</h4>
            <pre
              style={{
                background: '#0d1117',
                padding: 12,
                borderRadius: 4,
                overflow: 'auto',
                fontSize: '12px',
                color: '#c9d1d9',
                maxHeight: showFullJson ? 'none' : 280,
                position: 'relative'
              }}
            >
              {displayedJson}
              {!showFullJson && isJsonTooLong && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: 60,
                    background: 'linear-gradient(to top, rgba(13,17,23,0.95), rgba(13,17,23,0))'
                  }}
                />
              )}
            </pre>

            {isJsonTooLong && (
              <button
                onClick={() => setShowFullJson(!showFullJson)}
                style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  fontSize: '12px'
                }}
              >
                {showFullJson ? t('teach.hideAllShort') : t('teach.showAll')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
