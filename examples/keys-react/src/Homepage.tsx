import React, { useContext, useState } from 'react'
import { KeyManagerContext, useKeys } from './providers/keys'
import {
  Container,
  Grid2 as Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material'
import { Draw, AccountBalance } from '@mui/icons-material'
import SignMessageModal from './components/SignMessageModal'
import StakingPanel from './components/StakingPanel'
import {
  DirectImportConnector,
  TalismanConnectConnector,
  WalletConnectConnector,
} from './components/connectors'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`main-tabpanel-${index}`}
      aria-labelledby={`main-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export const Homepage: React.FC = () => {
  const { keyManager } = useContext(KeyManagerContext)
  const { keys } = useKeys()

  const [signModalKey, setSignModalKey] = useState<string>('')
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)

  const handleSignClick = (key: string) => {
    setSignModalKey(key)
    setSignModalOpen(true)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Container>
      <SignMessageModal
        open={signModalOpen}
        selectedKey={signModalKey}
        onClose={() => setSignModalOpen(false)}
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          🎯 Joystream SDK Examples
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Test KeyManager and StakingManager functionality
        </Typography>

        <Paper sx={{ width: '100%', mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="main tabs"
            >
              <Tab
                icon={<Draw />}
                label="Key Management"
                iconPosition="start"
              />
              <Tab
                icon={<AccountBalance />}
                label="Staking"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="h4"
                  component="h2"
                  align="center"
                  gutterBottom
                >
                  Connect your keys
                </Typography>
              </Grid>
              {keyManager && (
                <>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <WalletConnectConnector
                      onConnected={(wcWallet) =>
                        keyManager.addKeysProvider('WalletConnect', wcWallet)
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TalismanConnectConnector
                      onConnected={(wallet) => {
                        keyManager.addKeysProvider(wallet.extensionName, wallet)
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DirectImportConnector />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <List dense>
                  {keys.map((k, i) => (
                    <ListItem key={k.address} divider={i !== keys.length - 1}>
                      <ListItemText
                        primary={k.address}
                        secondary={k.provider}
                      />
                      <ListItemIcon>
                        <IconButton
                          edge="end"
                          aria-label="sign"
                          color="primary"
                          onClick={() => handleSignClick(k.address)}
                        >
                          <Draw />
                        </IconButton>
                      </ListItemIcon>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <StakingPanel />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  )
}

export default Homepage
