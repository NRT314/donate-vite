import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useAccount,
  useConnect,
  useSignMessage,
  useDisconnect,
} from 'wagmi'

const OIDC_SERVER_URL =
  import.meta.env.VITE_OIDC_SERVER_URL ||
  'https://donate-vite.onrender.com'

export default function DiscourseAuth() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const [statusText, setStatusText] = useState('Инициализация...')
  const [retryKey, setRetryKey] = useState(0)

  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectors, connectAsync } = useConnect()
  const { signMessageAsync } = useSignMessage()

  const preferredConnector = useMemo(() => {
    if (!connectors?.length) return undefined
    return connectors.find((c) => c.ready) || connectors[0]
  }, [connectors])

  // Utility: wait until condition is true or timeout
  const waitFor = async (fn, timeoutMs = 5000, intervalMs = 100) => {
    const start = Date.now()
    while (!fn() && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return fn()
  }

  const runAuthentication = async () => {
    try {
      if (!uid) {
        setStatusText('Ошибка: UID сессии не найден.')
        return
      }

      setStatusText('Подготовка к подключению кошелька...')

      if (!connectors || !connectors.length) {
        setStatusText('Кошельки не найдены.')
        return
      }

      let currentAddress = address

      // Если подключение "битое" — сразу сбрасываем
      if (isConnected && !currentAddress) {
        setStatusText('Сбрасываем старую сессию кошелька...')
        try {
          await disconnect()
          await waitFor(() => !isConnected, 5000)
        } catch (e) {
          console.warn('Disconnect failed:', e?.message)
        }
      }

      // Подключение
      if (!currentAddress) {
        const candidates = [
          preferredConnector,
          ...connectors.filter((c) => c.ready && c !== preferredConnector),
          connectors[0],
        ].filter(Boolean)

        for (const cand of candidates) {
          try {
            setStatusText(`Подключаем ${cand.name || cand.id}...`)
            const result = await connectAsync({ connector: cand })
            currentAddress =
              result?.account || result?.accounts?.[0] || null
            if (!currentAddress) {
              await waitFor(() => address, 3000)
              currentAddress = address
            }
            if (currentAddress) break
          } catch (err) {
            console.warn(
              'Connect failed for',
              cand?.name || cand?.id,
              err?.message || err
            )

            // Автофикс бага getChainId
            if (
              err?.message?.includes('getChainId') ||
              err?.toString()?.includes('getChainId')
            ) {
              console.log('Detected getChainId bug → resetting connector')
              await disconnect()
              await waitFor(() => !isConnected, 3000)
            }
          }
        }
      }

      if (!currentAddress) {
        setStatusText('Подключите, пожалуйста, кошелёк.')
        return
      }

      // Подпись
      setStatusText('Пожалуйста, подпишите сообщение в кошельке...')
      const message = `Sign this message to login to the forum: ${uid}`
      const signature = await signMessageAsync({ message })

      setStatusText('Проверка подписи и вход...')

      // Отправка формы на сервер
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `${OIDC_SERVER_URL}/oidc/wallet-callback`

      const createInput = (name, value) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      }

      createInput('uid', uid)
      createInput('walletAddress', currentAddress)
      createInput('signature', signature)

      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      console.error('Ошибка аутентификации:', err)

      // Автоматический повтор при баге getChainId
      if (
        err?.message?.includes('getChainId') ||
        err?.toString()?.includes('getChainId')
      ) {
        setStatusText('Обнаружена ошибка соединения, пробуем ещё раз...')
        await disconnect()
        setTimeout(() => setRetryKey((k) => k + 1), 500)
        return
      }

      setStatusText(
        `Ошибка: ${err?.shortMessage || err?.message || String(err)}`
      )
    }
  }

  // Основной эффект
  useEffect(() => {
    if (uid && connectors?.length) {
      runAuthentication()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, connectors, address, retryKey])

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Аутентификация для форума</h2>
      <p style={{ fontSize: '18px', minHeight: '30px' }}>{statusText}</p>
      {statusText.startsWith('Ошибка') && (
        <button
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          onClick={() => setRetryKey((k) => k + 1)}
        >
          Попробовать снова
        </button>
      )}
    </div>
  )
}
