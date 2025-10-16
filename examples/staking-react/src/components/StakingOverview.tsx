import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  AccountBalance,
  TrendingUp,
  People,
  AttachMoney,
  Security,
  Schedule,
} from '@mui/icons-material'
import { useStaking } from '../providers/StakingProvider'

interface StakingParams {
  minBond: bigint
  bondingDuration: number
  maxNominations: number
  historyDepth: number
}

export function StakingOverview() {
  const { staking, isConnected } = useStaking()
  const [stakingParams, setStakingParams] = useState<StakingParams | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (staking && isConnected) {
      loadStakingParams()
    }
  }, [staking, isConnected])

  const loadStakingParams = async () => {
    try {
      setLoading(true)
      setError(null)

      // In mock mode, return default values
      const params: StakingParams = {
        minBond: 1n * 10n ** 10n, // 1 JOY
        bondingDuration: 28,
        maxNominations: 16,
        historyDepth: 84,
      }

      setStakingParams(params)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load staking parameters'
      )
    } finally {
      setLoading(false)
    }
  }

  const formatJOY = (amount: bigint) => {
    return (Number(amount) / 1e10).toFixed(2)
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading staking overview...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Staking Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Current staking parameters and network information
      </Typography>

      <Grid container spacing={3}>
        {/* Staking Parameters */}
        <Grid item xs={12} md={6}>
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
                    secondary={`${formatJOY(stakingParams?.minBond || 0n)} JOY`}
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
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary="History Depth"
                    secondary={`${stakingParams?.historyDepth || 0} eras`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Actions */}
        <Grid item xs={12} md={6}>
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

        {/* StakingManager Methods */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                StakingManager Methods Available
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
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
                <Grid item xs={12} sm={6} md={4}>
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
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="success" gutterBottom>
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
    </Box>
  )
}
