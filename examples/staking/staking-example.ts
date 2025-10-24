/**
 * Staking Example
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
  console.log('Connecting to chain...')
  const provider = new WsProvider(RPC_ENDPOINT)
  const api = await ApiPromise.create({ provider })

  console.log('Connected to:', await api.rpc.system.chain())
  console.log('Node version:', (await api.rpc.system.version()).toString())

  // Initialize keyring
  const keyring = new Keyring({ type: 'sr25519' })
  const account = keyring.addFromMnemonic(MNEMONIC)

  console.log('\nUsing account:', account.address)

  // Create staking manager
  const staking = new StakingManager(api)

  // Example 1: Get staking parameters
  console.log('\n=== Staking Parameters ===')
  const params = await staking.getStakingParams()
  console.log(`Min bond: ${balanceToJoy(params.minBond)} JOY`)
  console.log(`Bonding duration: ${params.bondingDuration} eras`)
  console.log(`Max nominations: ${params.maxNominations}`)
  console.log(`History depth: ${params.historyDepth} eras`)

  // Example 2: Get all staking constants
  console.log('\n=== Staking Constants ===')
  const constants = await staking.getStakingConstants()
  console.log(`Sessions per era: ${constants.sessionsPerEra}`)
  console.log(
    `Max nominators rewarded: ${constants.maxNominatorRewardedPerValidator}`
  )
  console.log(
    `Min validator bond: ${balanceToJoy(constants.minValidatorBond)} JOY`
  )
  console.log(
    `Min nominator bond: ${balanceToJoy(constants.minNominatorBond)} JOY`
  )
  console.log(`Validator count: ${constants.validatorCount}`)

  // Example 3: Get account staking info
  console.log('\n=== Account Staking Info ===')
  const stakingInfo = await staking.getStakingInfo(account.address)
  if (stakingInfo) {
    console.log(`Controller: ${stakingInfo.controller}`)
    console.log(`Stash: ${stakingInfo.stash}`)
    console.log(`Bonded: ${balanceToJoy(stakingInfo.bonded)} JOY`)
    console.log(`Unbonding: ${balanceToJoy(stakingInfo.unbonding)} JOY`)
    console.log(`Withdrawable: ${balanceToJoy(stakingInfo.withdrawable)} JOY`)
    console.log(`Nominations: ${stakingInfo.nominations.join(', ')}`)
    console.log(`Payee: ${stakingInfo.payee}`)
  } else {
    console.log('No staking information found (account not bonded)')
  }

  // Example 4: Get active validators
  console.log('\n=== Active Validators ===')
  const validators = await staking.getValidators()
  console.log(`Total active validators: ${validators.length}`)

  // Sort by total stake
  validators.sort((a, b) => (a.totalStake > b.totalStake ? -1 : 1))

  console.log('\nTop 5 Validators by Stake:')
  validators.slice(0, 5).forEach((v, i) => {
    console.log(`\n${i + 1}. ${v.account}`)
    console.log(`   Total Stake: ${balanceToJoy(v.totalStake)} JOY`)
    console.log(`   Own Stake: ${balanceToJoy(v.ownStake)} JOY`)
    console.log(`   Commission: ${v.commission}%`)
    console.log(`   Nominators: ${v.nominatorCount}`)
    console.log(`   Era Points: ${v.eraPoints}`)
    console.log(`   Active: ${v.isActive}`)
  })

  // Example 5: Get waiting validators
  console.log('\n=== Waiting Validators ===')
  const waiting = await staking.getWaitingValidators()
  console.log(`Total waiting validators: ${waiting.length}`)

  if (waiting.length > 0) {
    console.log('\nTop 3 Waiting Validators by Stake:')
    waiting.slice(0, 3).forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.account}`)
      console.log(`   Total Stake: ${balanceToJoy(v.totalStake)} JOY`)
      console.log(`   Own Stake: ${balanceToJoy(v.ownStake)} JOY`)
      console.log(`   Commission: ${v.commission}%`)
    })
  }

  // Example 6: Get minimum active bond
  console.log('\n=== Minimum Active Bond ===')
  const minBondInfo = await staking.getMinActiveBond()
  if (minBondInfo) {
    console.log(`Min active bond: ${balanceToJoy(minBondInfo.minBond)} JOY`)
    console.log(`Active nominators: ${minBondInfo.activeNominators}`)
    console.log(`Max nominators: ${minBondInfo.maxNominators}`)
  }

  // Example 7: Get unbonding info
  console.log('\n=== Unbonding Information ===')
  const unbonding = await staking.getUnbondingInfo(account.address)
  console.log(`Unbonding amount: ${balanceToJoy(unbonding.amount)} JOY`)
  console.log(`Unbonding eras: ${unbonding.eras.join(', ')}`)

  // Example 8: Check if can bond
  console.log('\n=== Bond Validation ===')
  const bondAmount = joyToBalance(100) // 100 JOY
  const { canBond, reason: bondReason } = await staking.canBond(
    account.address,
    bondAmount
  )
  console.log(`Can bond ${balanceToJoy(bondAmount)} JOY: ${canBond}`)
  if (!canBond) {
    console.log(`Reason: ${bondReason}`)
  }

  // Example 9: Check if can nominate
  console.log('\n=== Nomination Validation ===')
  const targets = validators.slice(0, 3).map((v) => v.account)
  const { canNominate, reason: nomReason } = await staking.canNominate(
    account.address,
    targets
  )
  console.log(`Can nominate ${targets.length} validators: ${canNominate}`)
  if (!canNominate) {
    console.log(`Reason: ${nomReason}`)
  }

  // Example 10: Check if can validate
  console.log('\n=== Validation Check ===')
  const commission = 5 // 5%
  const { canValidate, reason: valReason } = await staking.canValidate(
    account.address,
    commission
  )
  console.log(
    `Can become validator with ${commission}% commission: ${canValidate}`
  )
  if (!canValidate) {
    console.log(`Reason: ${valReason}`)
  }

  // Example 11: Get nominator targets (if nominated)
  console.log('\n=== Current Nominations ===')
  const nominatorTargets = await staking.getNominatorTargets(account.address)
  if (nominatorTargets) {
    console.log(`Nominated ${nominatorTargets.length} validators:`)
    nominatorTargets.forEach((target, i) => {
      console.log(`\n${i + 1}. ${target.validator}`)
      console.log(`   Your Stake: ${balanceToJoy(target.stake)} JOY`)
      console.log(`   Active: ${target.isActive}`)
    })
  } else {
    console.log('Not currently nominating any validators')
  }

  // Example 12: Get validator preferences (if validator)
  console.log('\n=== Validator Preferences ===')
  const validatorPrefs = await staking.getValidatorPrefs(account.address)
  if (validatorPrefs) {
    console.log(`Commission: ${validatorPrefs.commission}%`)
    console.log(`Blocked: ${validatorPrefs.blocked}`)
  } else {
    console.log('Not a validator')
  }

  // Example 13: Get slashing spans
  console.log('\n=== Slashing Information ===')
  const slashingSpans = await staking.getSlashingSpans(account.address)
  if (slashingSpans) {
    console.log(`Last non-zero slash: Era ${slashingSpans.lastNonzeroSlash}`)
    console.log(`Prior slashes: ${slashingSpans.prior.length}`)
    console.log(`Span index: ${slashingSpans.spanIndex}`)
  } else {
    console.log('No slashing history')
  }

  // Example 14: Get staking rewards for current era
  console.log('\n=== Era Rewards ===')
  const currentEra = await api.query.staking.currentEra()
  const currentEraNumber = currentEra
    .unwrapOr(api.createType('u32', 0))
    .toNumber()
  const rewards = await staking.getStakingRewards(currentEraNumber)
  if (rewards) {
    console.log(`Era: ${rewards.era}`)
    console.log(`Total Rewards: ${balanceToJoy(rewards.totalRewards)} JOY`)
    console.log(
      `Validator Rewards: ${balanceToJoy(rewards.validatorRewards)} JOY`
    )
    console.log(
      `Nominator Rewards: ${balanceToJoy(rewards.nominatorRewards)} JOY`
    )
  }

  console.log('\n=== Transaction Examples (NOT EXECUTED) ===')
  console.log('\nTo bond and nominate:')
  console.log(
    `const tx = staking.bondAndNominate(account, ${balanceToJoy(bondAmount)} JOY, targets, 'Staked')`
  )
  console.log(`await tx.signAndSend(account)`)

  console.log('\nTo become a validator:')
  console.log(`const tx = staking.validate(${commission}, false)`)
  console.log(`await tx.signAndSend(account)`)

  console.log('\nTo unbond:')
  console.log(`const tx = staking.unbond(${balanceToJoy(bondAmount)} JOY)`)
  console.log(`await tx.signAndSend(account)`)

  console.log('\nTo claim rewards:')
  console.log(`const tx = staking.payoutStakers(validatorAddress, eraNumber)`)
  console.log(`await tx.signAndSend(account)`)

  // Cleanup
  await api.disconnect()
  console.log('\nDisconnected from chain')
}

// Run the example
main()
  .catch(console.error)
  .finally(() => process.exit())
