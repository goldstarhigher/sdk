import React, { useState } from 'react'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material'
import { StakingProvider } from './providers/StakingProvider'
import { ConnectionStatus } from './components/ConnectionStatus'
import { StakingOverview } from './components/StakingOverview'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StakingProvider
        onConnectionChange={setIsConnected}
        onConnectionError={setConnectionError}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              🎯 Joystream Staking UI
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="text.secondary"
              gutterBottom
            >
              Test the StakingManager functionality through a React interface
            </Typography>
          </Box>

          <ConnectionStatus isConnected={isConnected} error={connectionError} />

          {isConnected ? (
            <Paper sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs aria-label="staking tabs">
                  <Tab label="Overview" />
                </Tabs>
              </Box>

              <StakingOverview />
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Connecting to Joystream...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we establish a connection to the Joystream
                network.
              </Typography>
            </Paper>
          )}
        </Container>
      </StakingProvider>
    </ThemeProvider>
  )
}

export default App
