import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { ApiPromise } from '@polkadot/api'
import { StakingManager } from '@joystream/sdk-core/staking'
import { TxManager } from '@joystream/sdk-core/tx'
import { KeyManagerContext } from './keys'

interface StakingContextType {
  api: ApiPromise | null
  staking: StakingManager | null
  tx: TxManager | null
  isConnected: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const StakingContext = createContext<StakingContextType | undefined>(undefined)

interface StakingProviderProps {
  children: ReactNode
}

export function StakingProvider({ children }: StakingProviderProps) {
  const { keyManager } = useContext(KeyManagerContext)
  const [api, setApi] = useState<ApiPromise | null>(null)
  const [staking, setStaking] = useState<StakingManager | null>(null)
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
      const mockTx = keyManager ? new TxManager(mockApi, keyManager) : null

      setApi(mockApi)
      setStaking(mockStaking)
      setTx(mockTx)
      setIsConnected(true)

      console.log('✅ Connected to Joystream network (mock mode)')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown connection error'
      setError(errorMessage)
      setIsConnected(false)

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
      setTx(null)
      setIsConnected(false)
      setError(null)

      console.log('🔌 Disconnected from Joystream network')
    } catch (err) {
      console.error('❌ Error during disconnect:', err)
    }
  }

  useEffect(() => {
    // Auto-connect when keyManager is available
    if (keyManager) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [keyManager])

  const value: StakingContextType = {
    api,
    staking,
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
