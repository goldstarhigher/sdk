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
      // Connect to real Joystream network
      const { createApi } = await import('@joystream/sdk-core/chain')

      // Choose your network endpoint
      const endpoint =
        process.env.REACT_APP_JOYSTREAM_ENDPOINT || 'wss://rpc.joystream.org' // Mainnet
      // const endpoint = 'wss://testnet-rpc.joystream.org' // Testnet
      // const endpoint = 'ws://localhost:9944' // Local node

      const realApi = await createApi(endpoint)
      const realStaking = new StakingManager(realApi)
      const realTx = keyManager ? new TxManager(realApi, keyManager) : null

      setApi(realApi)
      setStaking(realStaking)
      setTx(realTx)
      setIsConnected(true)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown connection error'
      setError(errorMessage)
      setIsConnected(false)

      // Error handled by setError
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
    } catch (err) {
      // Error during disconnect - handled silently
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
