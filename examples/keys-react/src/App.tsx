import { Homepage } from './Homepage'
import { KeyManagerProvider } from './providers/keys'
import { StakingProvider } from './providers/staking'

function App() {
  return (
    <KeyManagerProvider>
      <StakingProvider>
        <Homepage />
      </StakingProvider>
    </KeyManagerProvider>
  )
}

export default App
