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

  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectors, connectAsync, isPending: isConnecting } = useConnect()
  const { signMessageAsync, isPending: isSigning } = useSignMessage()

  // Берём первый "готовый" коннектор (или первый в списке)
  const preferredConnector = useMemo(() => {
    if (!connectors?.length) return undefined
    return connectors.find((c) => c.ready) || connectors[0]
  }, [connectors])

  // Утилита: дождаться isConnected === false (с таймаутом)
  const waitForDisconnected = async (timeoutMs = 5000) => {
    const start = Date.now()
    while (isConnected && Date.now() - start < timeoutMs) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 100))
    }
    return !isConnected
  }

  useEffect(() => {
    let cancelled = false

    const runAuthentication = async () => {
      try {
        if (!uid) {
          setStatusText('Ошибка: UID сессии не найден.')
          return
        }

        setStatusText('Подготовка к подключению кошелька...')

        // Если уже есть подключение, отключаемся прежде чем подключаться заново
        if (isConnected) {
          setStatusText('Отключаем старую сессию кошелька...')
          try {
            await disconnect()
            // Даем состояние обновиться (проверяем через poll)
            await waitForDisconnected(5000)
          } catch (e) {
            // Если не удалось отключиться — логируем, но продолжаем попытки подключиться заново
            console.warn('Disconnect failed or timed out:', e && e.message)
          }
        }

        // Убедимся, что есть доступные коннекторы
        if (!connectors || connectors.length === 0) {
          setStatusText('Кошельки не найдены.')
          return
        }

        // Попытка подключения: пробуем preferredConnector, затем любой ready, затем первый.
        const tryConnect = async () => {
          const candidates = [
            preferredConnector,
            ...connectors.filter((c) => c.ready && c !== preferredConnector),
            connectors[0],
          ].filter(Boolean)

          for (const cand of candidates) {
            try {
              setStatusText(`Подключаем ${cand.name || cand.id}...`)
              const result = await connectAsync({ connector: cand })
              // В большинстве версий wagmi result.account или result?.accounts[0]
              const acc =
                result?.account || result?.accounts?.[0] || (await (async () => {
                  // если connectAsync не вернул адрес — берем address из useAccount (он должен обновиться)
                  const start = Date.now()
                  while (!address && Date.now() - start < 3000) {
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise((r) => setTimeout(r, 100))
                  }
                  return address
                })())
              if (acc) return acc
            } catch (err) {
              console.warn('connect candidate failed:', cand?.id || cand?.name, err && err.message)
              // пробуем следующий кандидат
            }
          }
          return null
        }

        let currentAddress = address
        if (!currentAddress) {
          currentAddress = await tryConnect()
        }

        if (!currentAddress) {
          throw new Error('Не удалось подключить кошелек.')
        }

        setStatusText('Пожалуйста, подпишите сообщение в кошельке...')
        const message = `Sign this message to login to the forum: ${uid}`

        // Подпись
        const signature = await signMessageAsync({ message })

        setStatusText('Проверка подписи...')

        // Отправляем форму (редирект)
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
        setStatusText(`Ошибка: ${err?.shortMessage || err?.message || String(err)}`)
      }
    }

    if (uid && connectors && !isConnecting && !isSigning && !cancelled) {
      runAuthentication()
    }

    return () => {
      cancelled = true
    }
  }, [
    uid,
    address,
    isConnected,
    connectors,
    connectAsync,
    signMessageAsync,
    disconnect,
    isConnecting,
    isSigning,
    preferredConnector,
  ])

  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <h2>Аутентификация для форума</h2>
      <p style={{ fontSize: '18px', minHeight: '30px' }}>{statusText}</p>
    </div>
  )
}
