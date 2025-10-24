/**
 * Test Staking with REAL Joystream Network - Production Version
 *
 * This script connects to the actual Joystream network and queries real data.
 * No transactions are submitted - read-only mode.
 */

import { ApiPromise, WsProvider } from '@polkadot/api'
import { StakingManager, balanceToJoy } from '@joystream/sdk-core/staking'

// Choose your endpoint
const ENDPOINTS = {
  mainnet: 'wss://rpc.joystream.org',
  testnet: 'wss://testnet-rpc.joystream.org',
  local: 'ws://localhost:9944',
}

const endpoint =
  process.env.NETWORK === 'testnet'
    ? ENDPOINTS.testnet
    : process.env.NETWORK === 'local'
      ? ENDPOINTS.local
      : ENDPOINTS.mainnet

async function main() {
  try {
    // Connect to network
    const provider = new WsProvider(endpoint)
    const api = await ApiPromise.create({ provider })

    // Create staking manager
    const staking = new StakingManager(api)

    // Test 1: Get staking parameters
    const params = await staking.getStakingParams()

    // Test 2: Get validators
    const validators = await staking.getValidators()

    // Test 3: Get waiting validators
    const waiting = await staking.getWaitingValidators()

    // Test 4: Get staking constants
    const constants = await staking.getStakingConstants()

    // Test 5: Get min active bond
    const minActiveBond = await staking.getMinActiveBond()

    // Test 6: Get nominator targets for a specific account
    const testAccount = validators[0]?.account
    if (testAccount) {
      const targets = await staking.getNominatorTargets(testAccount)
    }

    // Test 7: Get validator preferences
    if (validators.length > 0) {
      const prefs = await staking.getValidatorPrefs(validators[0].account)
    }

    // Test 8: Get slashing spans
    if (validators.length > 0) {
      const slashingSpans = await staking.getSlashingSpans(
        validators[0].account
      )
    }

    // Test 9: Get unbonding information
    if (validators.length > 0) {
      const unbondingInfo = await staking.getUnbondingInfo(
        validators[0].account
      )
    }

    // Test 10: Get staking rewards
    if (validators.length > 0) {
      const rewards = await staking.getStakingRewards(validators[0].account)
    }

    // Test 11: Get staking info
    if (validators.length > 0) {
      const stakingInfo = await staking.getStakingInfo(validators[0].account)
    }

    // Test 12: Check validation capabilities
    if (validators.length > 0) {
      const canValidate = await staking.canValidate(validators[0].account)
    }

    // Test 13: Check bonding capabilities
    if (validators.length > 0) {
      const canBond = await staking.canBond(
        validators[0].account,
        BigInt(1000000000000)
      )
    }

    // Test 14: Check unbonding capabilities
    if (validators.length > 0) {
      const canUnbond = await staking.canUnbond(
        validators[0].account,
        BigInt(500000000000)
      )
    }

    // Test 15: Check nomination capabilities
    if (validators.length > 1) {
      const canNominate = await staking.canNominate(validators[0].account, [
        validators[1].account,
      ])
    }

    // Cleanup
    await api.disconnect()
  } catch (error) {
    process.exit(1)
  }
}

// Run the test
main().catch((error) => {
  process.exit(1)
})
