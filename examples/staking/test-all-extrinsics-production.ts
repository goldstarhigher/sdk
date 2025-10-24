/**
 * Complete Staking Extrinsics Demo - Production Version
 *
 * This script demonstrates ALL staking extrinsics available in the SDK:
 * - Bond, BondExtra, Unbond, Rebond, WithdrawUnbonded
 * - Nominate, Validate, Chill
 * - SetController, SetPayee
 * - PayoutStakers, PayoutStakersByPage
 * - Rebag, PutInFrontOf
 * - BondAndNominate (batch operation)
 */

import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'
import {
  StakingManager,
  balanceToJoy,
  joyToBalance,
} from '@joystream/sdk-core/staking'

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'wss://rpc.joystream.org'
const MNEMONIC = process.env.MNEMONIC || 'your mnemonic here'

async function main() {
  const provider = new WsProvider(RPC_ENDPOINT)
  const api = await ApiPromise.create({ provider })

  // Initialize keyring
  const keyring = new Keyring({ type: 'sr25519' })
  const account = keyring.addFromMnemonic(MNEMONIC)

  // Create staking manager
  const staking = new StakingManager(api)

  // Get validators for nomination examples
  const validators = await staking.getValidators()
  const validator1 = validators[0]?.account
  const validator2 = validators[1]?.account

  // === BONDING EXTRINSICS ===

  // 1. Bond tokens
  const bondTx = staking.bond(account.address, joyToBalance('100'), 'Stash')

  // 2. Bond extra tokens
  const bondExtraTx = staking.bondExtra(joyToBalance('50'))

  // 3. Unbond tokens
  const unbondTx = staking.unbond(joyToBalance('25'))

  // 4. Rebond tokens
  const rebondTx = staking.rebond(joyToBalance('10'))

  // 5. Withdraw unbonded tokens
  const withdrawUnbondedTx = staking.withdrawUnbonded(0)

  // === VALIDATION EXTRINSICS ===

  // 6. Validate (become validator)
  const validateTx = staking.validate(5.0, false) // 5% commission, not blocked

  // 7. Chill (stop validating)
  const chillTx = staking.chill()

  // === NOMINATION EXTRINSICS ===

  // 8. Nominate validators
  const nominateTx = staking.nominate([validator1, validator2])

  // === CONTROLLER EXTRINSICS ===

  // 9. Set controller
  const setControllerTx = staking.setController(account.address)

  // 10. Set payee
  const setPayeeTx = staking.setPayee('Stash')

  // === REWARD EXTRINSICS ===

  // 11. Payout stakers
  const payoutTx = staking.payoutStakers(validator1, 1)

  // 12. Payout stakers by page
  const payoutPageTx = staking.payoutStakersByPage(validator1, 1, 0)

  // === BAG EXTRINSICS ===

  // 13. Rebag account
  const rebagTx = staking.rebag(account.address)

  // 14. Put account in front of another
  const putInFrontTx = staking.putInFrontOf(account.address)

  // === BATCH EXTRINSICS ===

  // 15. Bond and nominate in one transaction
  const bondAndNominateTx = staking.bondAndNominate(
    joyToBalance('200'),
    [validator1, validator2],
    'Stash'
  )

  // === QUERY EXAMPLES ===

  // Get staking parameters
  const params = await staking.getStakingParams()

  // Get validators
  const allValidators = await staking.getValidators()

  // Get waiting validators
  const waiting = await staking.getWaitingValidators()

  // Get staking constants
  const constants = await staking.getStakingConstants()

  // Get min active bond
  const minActiveBond = await staking.getMinActiveBond()

  // Get staking info for account
  const stakingInfo = await staking.getStakingInfo(account.address)

  // Get nominator targets
  const targets = await staking.getNominatorTargets(account.address)

  // Get validator preferences
  if (validator1) {
    const prefs = await staking.getValidatorPrefs(validator1)
  }

  // Get slashing spans
  if (validator1) {
    const slashingSpans = await staking.getSlashingSpans(validator1)
  }

  // Get unbonding information
  const unbondingInfo = await staking.getUnbondingInfo(account.address)

  // Get staking rewards
  const rewards = await staking.getStakingRewards(account.address)

  // === VALIDATION HELPERS ===

  // Check if account can bond
  const canBond = await staking.canBond(account.address, joyToBalance('100'))

  // Check if account can unbond
  const canUnbond = await staking.canUnbond(account.address, joyToBalance('50'))

  // Check if account can nominate
  const canNominate = await staking.canNominate(account.address, [validator1])

  // Check if account can validate
  const canValidate = await staking.canValidate(account.address)

  // Cleanup
  await api.disconnect()
}

// Run the demo
main().catch((error) => {
  process.exit(1)
})
