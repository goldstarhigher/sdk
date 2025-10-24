/**
 * Staking Example - Production Version
 *
 * This example demonstrates how to use the Staking module to:
 * - Query staking information
 * - Bond and nominate validators
 * - Become a validator
 * - Manage rewards
 */

import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'
import {
  StakingManager,
  balanceToJoy,
  joyToBalance,
} from '@joystream/sdk/staking'

// Configuration
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'ws://localhost:9944'
const MNEMONIC = process.env.MNEMONIC || 'your mnemonic here'

async function main() {
  const provider = new WsProvider(RPC_ENDPOINT)
  const api = await ApiPromise.create({ provider })

  // Initialize keyring
  const keyring = new Keyring({ type: 'sr25519' })
  const account = keyring.addFromMnemonic(MNEMONIC)

  // Create staking manager
  const staking = new StakingManager(api)

  // Example 1: Get staking parameters
  const params = await staking.getStakingParams()

  // Example 2: Get all staking constants
  const constants = await staking.getStakingConstants()

  // Example 3: Get validators
  const validators = await staking.getValidators()
  const accountId = account.address

  // Example 4: Get staking information
  const stakingInfo = await staking.getStakingInfo(accountId)

  // Example 5: Get waiting validators
  const waiting = await staking.getWaitingValidators()

  // Example 6: Get nominator targets
  const targets = await staking.getNominatorTargets(accountId)

  // Example 7: Get min active bond
  const minActiveBond = await staking.getMinActiveBond()

  // Example 8: Check if account can bond
  const canBond = await staking.canBond(accountId, joyToBalance('100'))

  // Example 9: Check if account can unbond
  const canUnbond = await staking.canUnbond(accountId, joyToBalance('50'))

  // Example 10: Check if account can nominate
  const canNominate = await staking.canNominate(accountId, [
    validators[0]?.account,
  ])

  // Example 11: Check if account can validate
  const canValidate = await staking.canValidate(accountId)

  // Example 12: Get validator preferences
  if (validators.length > 0) {
    const prefs = await staking.getValidatorPrefs(validators[0].account)
  }

  // Example 13: Get slashing spans
  const slashingSpans = await staking.getSlashingSpans(accountId)

  // Example 14: Get unbonding information
  const unbondingInfo = await staking.getUnbondingInfo(accountId)

  // Example 15: Get staking rewards
  const rewards = await staking.getStakingRewards(accountId)

  // Example 16: Bond tokens
  const bondTx = staking.bond(accountId, joyToBalance('100'), 'Stash')

  // Example 17: Unbond tokens
  const unbondTx = staking.unbond(joyToBalance('50'))

  // Example 18: Nominate validators
  const nominateTx = staking.nominate([
    validators[0]?.account,
    validators[1]?.account,
  ])

  // Example 19: Validate (become validator)
  const validateTx = staking.validate(5.0, false) // 5% commission

  // Example 20: Set controller
  const setControllerTx = staking.setController(accountId)

  // Example 21: Set payee
  const setPayeeTx = staking.setPayee('Stash')

  // Example 22: Chill (stop validating)
  const chillTx = staking.chill()

  // Example 23: Payout stakers
  const payoutTx = staking.payoutStakers(validators[0]?.account, 1)

  // Example 24: Payout stakers by page
  const payoutPageTx = staking.payoutStakersByPage(validators[0]?.account, 1, 0)

  // Example 25: Rebond tokens
  const rebondTx = staking.rebond(joyToBalance('25'))

  // Example 26: Rebag account
  const rebagTx = staking.rebag(accountId)

  // Example 27: Put account in front of another
  const putInFrontTx = staking.putInFrontOf(accountId)

  // Example 28: Bond and nominate in one transaction
  const bondAndNominateTx = staking.bondAndNominate(
    joyToBalance('200'),
    [validators[0]?.account],
    'Stash'
  )

  // Cleanup
  await api.disconnect()
}

// Run the example
main().catch((error) => {
  process.exit(1)
})
