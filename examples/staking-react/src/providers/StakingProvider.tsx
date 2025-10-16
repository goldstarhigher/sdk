import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { ApiPromise } from '@polkadot/api'
import { StakingManager } from '@joystream/sdk-core/staking'
import { KeyManager } from '@joystream/sdk-core/keys'
import { TxManager } from '@joystream/sdk-core/tx'

interface StakingContextType {
  api: ApiPromise | null
  staking: StakingManager | null
  keys: KeyManager | null
  tx: TxManager | null
  isConnected: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const StakingContext = createContext<StakingContextType | undefined>(undefined)

interface StakingProviderProps {
  children: ReactNode
  onConnectionChange?: (connected: boolean) => void
  onConnectionError?: (error: string | null) => void
}

export function StakingProvider({
  children,
  onConnectionChange,
  onConnectionError,
}: StakingProviderProps) {
  const [api, setApi] = useState<ApiPromise | null>(null)
  const [staking, setStaking] = useState<StakingManager | null>(null)
  const [keys, setKeys] = useState<KeyManager | null>(null)
  const [tx, setTx] = useState<TxManager | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    try {
      setError(null)

      // For demo purposes, we'll use a mock connection
      // In a real app, you'd connect to an actual Joystream node
      console.log('🔌 Connecting to Joystream network...')

      // Create mock API for demonstration
      const mockApi = {} as ApiPromise
      const mockStaking = new StakingManager(mockApi)
      const mockKeys = new KeyManager({ keyringOptions: { isDev: true } })
      const mockTx = new TxManager(mockApi, mockKeys)

      setApi(mockApi)
      setStaking(mockStaking)
      setKeys(mockKeys)
      setTx(mockTx)
      setIsConnected(true)

      onConnectionChange?.(true)
      onConnectionError?.(null)

      console.log('✅ Connected to Joystream network (mock mode)')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown connection error'
      setError(errorMessage)
      setIsConnected(false)

      onConnectionChange?.(false)
      onConnectionError?.(errorMessage)

      console.error('❌ Failed to connect:', errorMessage)
    }
  }

  const disconnect = async () => {
    try {
      if (api) {
        await api.disconnect()
      }

      setApi(null)
      setStaking(null)
      setKeys(null)
      setTx(null)
      setIsConnected(false)
      setError(null)

      onConnectionChange?.(false)
      onConnectionError?.(null)

      console.log('🔌 Disconnected from Joystream network')
    } catch (err) {
      console.error('❌ Error during disconnect:', err)
    }
  }

  useEffect(() => {
    // Auto-connect on mount
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [])

  const value: StakingContextType = {
    api,
    staking,
    keys,
    tx,
    isConnected,
    error,
    connect,
    disconnect,
  }

  return (
    <StakingContext.Provider value={value}>{children}</StakingContext.Provider>
  )
}

export function useStaking() {
  const context = useContext(StakingContext)
  if (context === undefined) {
    throw new Error('useStaking must be used within a StakingProvider')
  }
  return context
}
