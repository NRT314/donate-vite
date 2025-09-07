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

  const waitFor = async (fn, timeoutMs = 5000, intervalMs = 100) => {
    const start = Date.now()
    while (!fn() && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return fn()
  }

  const runAuthentication = async () => {
    try {
      // Обработка выхода
      if (searchParams.get('post_logout_redirect_uri')) {
        setStatusText('Вы успешно вышли из системы.')
        return
      }

      if (!uid) {
        setStatusText('Ошибка: UID сессии не найден.')
        return
      }

      setStatusText('Подготовка к подключению кошелька...')

      if (!connectors?.length) {
        setStatusText('Пожалуйста, подключите кошелек.')
        return
      }

      let currentAddress = address

      // Если есть уже подключенный кошелек — используем его
      if (!currentAddress && isConnected) {
        setStatusText('Обнаружена активная сессия кошелька...')
        await waitFor(() => address, 3000)
        currentAddress = address
      }

      // Подключение, если кошелек не найден
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
            currentAddress = result?.account || result?.accounts?.[0] || null
            if (!currentAddress) {
              await waitFor(() => address, 3000)
              currentAddress = address
            }
            if (currentAddress) break
          } catch (err) {
            console.warn('Connect failed for', cand?.name || cand?.id, err)
          }
        }
      }

      if (!currentAddress) {
        setStatusText('Пожалуйста, подключите кошелек.')
        return
      }

      // Подпись
      setStatusText('Пожалуйста, подпишите сообщение для входа...')
      const message = `Sign this message to login to the forum: ${uid}`
      const signature = await signMessageAsync({ message })

      setStatusText('Проверка подписи и вход в систему...')

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
      setStatusText(
        `Ошибка: ${err?.shortMessage || err?.message || String(err)}`
      )
    }
  }

  useEffect(() => {
    if (uid && connectors?.length) {
      runAuthentication()
    }
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
