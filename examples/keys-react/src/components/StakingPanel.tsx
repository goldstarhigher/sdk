import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid2 as Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  AlertTitle,
  Paper,
  Tabs,
  Tab,
} from '@mui/material'
import {
  AccountBalance,
  TrendingUp,
  People,
  AttachMoney,
  Security,
  Schedule,
  Lock,
  LockOpen,
  HowToVote,
  Payment,
} from '@mui/icons-material'
import { useStaking } from '../providers/staking'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface StakingParams {
  minBond: bigint
  bondingDuration: number
  maxNominations: number
  historyDepth: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`staking-tabpanel-${index}`}
      aria-labelledby={`staking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export const StakingPanel: React.FC = () => {
  const { staking, isConnected, error } = useStaking()
  const [tabValue, setTabValue] = useState(0)
  const [stakingParams, setStakingParams] = useState<StakingParams | null>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const loadStakingParams = async () => {
    if (!staking) return

    try {
      // In mock mode, return default values
      const params = {
        minBond: BigInt(10000000000), // 1 JOY (10^10)
        bondingDuration: 28,
        maxNominations: 16,
        historyDepth: 84,
      }
      setStakingParams(params)
    } catch (err) {
      console.error('Failed to load staking params:', err)
    }
  }

  useEffect(() => {
    if (staking && isConnected) {
      loadStakingParams()
    }
  }, [staking, isConnected])

  const formatJOY = (amount: bigint) => {
    return (Number(amount) / 10000000000).toFixed(2)
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Staking Connection Error</AlertTitle>
          {error}
        </Alert>
      </Container>
    )
  }

  if (!isConnected) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Connecting to Staking...</AlertTitle>
          Please wait while we establish a connection to the staking system.
        </Alert>
      </Container>
    )
  }

  return (
    <Container>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          🎯 Staking Manager
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Test the StakingManager functionality
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Connected to Staking System</AlertTitle>
          StakingManager is ready for testing
          <Chip label="Mock Mode" size="small" color="info" sx={{ ml: 2 }} />
        </Alert>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="staking tabs"
            >
              <Tab label="Overview" />
              <Tab label="Bonding" />
              <Tab label="Validators" />
              <Tab label="Rewards" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Staking Parameters
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <AttachMoney />
                        </ListItemIcon>
                        <ListItemText
                          primary="Minimum Bond"
                          secondary={`${formatJOY(stakingParams?.minBond || BigInt(0))} JOY`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Schedule />
                        </ListItemIcon>
                        <ListItemText
                          primary="Bonding Duration"
                          secondary={`${stakingParams?.bondingDuration || 0} eras`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <People />
                        </ListItemIcon>
                        <ListItemText
                          primary="Max Nominations"
                          secondary={`${stakingParams?.maxNominations || 0} validators`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Available Actions
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Bond Tokens"
                          secondary="Lock tokens to participate in staking"
                        />
                        <Chip label="Available" color="success" size="small" />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Nominate Validators"
                          secondary="Choose validators to support"
                        />
                        <Chip label="Available" color="success" size="small" />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Unbond Tokens"
                          secondary="Start the unbonding process"
                        />
                        <Chip label="Available" color="success" size="small" />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Claim Rewards"
                          secondary="Withdraw earned staking rewards"
                        />
                        <Chip label="Available" color="success" size="small" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      StakingManager Methods Available
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          gutterBottom
                        >
                          Query Methods
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="getStakingParams()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="getValidators()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="getStakingInfo()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="getValidatorInfo()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="getUnbondingInfo()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="getStakingRewards()" />
                          </ListItem>
                        </List>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography
                          variant="subtitle2"
                          color="secondary"
                          gutterBottom
                        >
                          Extrinsic Methods
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="bond()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="unbond()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="nominate()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="chill()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="setPayee()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="withdrawUnbonded()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="payoutStakers()" />
                          </ListItem>
                        </List>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography
                          variant="subtitle2"
                          color="success"
                          gutterBottom
                        >
                          Utility Methods
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="canBond()" />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="canUnbond()" />
                          </ListItem>
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Bond Tokens
                    </Typography>
                    <TextField
                      fullWidth
                      label="Amount (JOY)"
                      type="number"
                      defaultValue="100"
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Controller Account"
                      margin="normal"
                      placeholder="Enter controller account address"
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        console.log('🔒 Bond transaction would be created here')
                        alert('Bond transaction created! (Mock mode)')
                      }}
                    >
                      Bond Tokens
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <LockOpen sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Unbond Tokens
                    </Typography>
                    <TextField
                      fullWidth
                      label="Amount to Unbond (JOY)"
                      type="number"
                      defaultValue="50"
                      margin="normal"
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        console.log(
                          '🔓 Unbond transaction would be created here'
                        )
                        alert('Unbond transaction created! (Mock mode)')
                      }}
                    >
                      Unbond Tokens
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <HowToVote sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Nominate Validators
                    </Typography>
                    <TextField
                      fullWidth
                      label="Validator Addresses (comma-separated)"
                      multiline
                      rows={3}
                      margin="normal"
                      placeholder="Enter validator addresses, one per line"
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        console.log(
                          '🗳️ Nominate transaction would be created here'
                        )
                        alert('Nominate transaction created! (Mock mode)')
                      }}
                    >
                      Nominate Validators
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Payment sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Claim Rewards
                    </Typography>
                    <TextField
                      fullWidth
                      label="Validator Address"
                      margin="normal"
                      placeholder="Enter validator address"
                    />
                    <TextField
                      fullWidth
                      label="Era"
                      type="number"
                      margin="normal"
                      placeholder="Enter era number"
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        console.log(
                          '💰 Payout transaction would be created here'
                        )
                        alert('Payout transaction created! (Mock mode)')
                      }}
                    >
                      Claim Rewards
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Withdraw Unbonded
                    </Typography>
                    <TextField
                      fullWidth
                      label="Number of Slashing Spans"
                      type="number"
                      defaultValue="0"
                      margin="normal"
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        console.log(
                          '💸 Withdraw unbonded transaction would be created here'
                        )
                        alert(
                          'Withdraw unbonded transaction created! (Mock mode)'
                        )
                      }}
                    >
                      Withdraw Unbonded
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  )
}

export default StakingPanel
