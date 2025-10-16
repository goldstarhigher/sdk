import React from 'react'
import { Alert, AlertTitle, Box, Chip } from '@mui/material'

interface ConnectionStatusProps {
  isConnected: boolean
  error: string | null
}

export function ConnectionStatus({
  isConnected,
  error,
}: ConnectionStatusProps) {
  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="error">
          <AlertTitle>Connection Error</AlertTitle>
          {error}
        </Alert>
      </Box>
    )
  }

  if (isConnected) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="success">
          <AlertTitle>Connected</AlertTitle>
          Successfully connected to Joystream network
          <Chip label="Mock Mode" size="small" color="info" sx={{ ml: 2 }} />
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert severity="info">
        <AlertTitle>Connecting...</AlertTitle>
        Establishing connection to Joystream network
      </Alert>
    </Box>
  )
}
