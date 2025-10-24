/**
 * Test Staking with REAL Joystream Network
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
  console.log('🌐 REAL NETWORK MODE')
  console.log('='.repeat(50))
  console.log(`Connecting to: ${endpoint}\n`)

  try {
    // Connect to real network
    const provider = new WsProvider(endpoint)
    const api = await ApiPromise.create({ provider })

    console.log('✅ Connected successfully!')
    console.log(`Chain: ${await api.rpc.system.chain()}`)
    console.log(`Version: ${(await api.rpc.system.version()).toString()}`)
    console.log('='.repeat(50))

    // Create staking manager
    const staking = new StakingManager(api)

    // Get real staking parameters
    console.log('\n📊 REAL STAKING PARAMETERS')
    console.log('-'.repeat(50))
    const params = await staking.getStakingParams()
    console.log(`Minimum Bond: ${balanceToJoy(params.minBond)} JOY`)
    console.log(`Bonding Duration: ${params.bondingDuration} eras`)
    console.log(`Max Nominations: ${params.maxNominations} validators`)
    console.log(`History Depth: ${params.historyDepth} eras`)

    // Get real validators
    console.log('\n🏆 ACTIVE VALIDATORS (REAL DATA)')
    console.log('-'.repeat(50))
    const validators = await staking.getValidators()
    console.log(`Total Active Validators: ${validators.length}`)

    // Sort by stake
    validators.sort((a, b) => (a.totalStake > b.totalStake ? -1 : 1))

    console.log('\nTop 10 Validators by Stake:')
    validators.slice(0, 10).forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.account}`)
      console.log(
        `   Total Stake: ${balanceToJoy(v.totalStake).toLocaleString()} JOY`
      )
      console.log(
        `   Own Stake: ${balanceToJoy(v.ownStake).toLocaleString()} JOY`
      )
      console.log(`   Commission: ${v.commission.toFixed(2)}%`)
      console.log(`   Nominators: ${v.nominatorCount}`)
      console.log(`   Era Points: ${v.eraPoints}`)
      console.log(`   Active: ${v.isActive ? '✅' : '❌'}`)
    })

    // Get waiting validators
    console.log('\n⏳ WAITING VALIDATORS')
    console.log('-'.repeat(50))
    const waiting = await staking.getWaitingValidators()
    console.log(`Total Waiting: ${waiting.length}`)

    if (waiting.length > 0) {
      console.log('\nTop 5 Waiting Validators:')
      waiting.slice(0, 5).forEach((v, i) => {
        console.log(`${i + 1}. ${v.account}`)
        console.log(
          `   Stake: ${balanceToJoy(v.totalStake).toLocaleString()} JOY`
        )
        console.log(`   Commission: ${v.commission.toFixed(2)}%`)
      })
    }

    // Get staking constants
    console.log('\n⚙️  STAKING CONSTANTS')
    console.log('-'.repeat(50))
    const constants = await staking.getStakingConstants()
    console.log(`Sessions per Era: ${constants.sessionsPerEra}`)
    console.log(
      `Max Nominators Rewarded: ${constants.maxNominatorRewardedPerValidator}`
    )
    console.log(
      `Min Validator Bond: ${balanceToJoy(constants.minValidatorBond)} JOY`
    )
    console.log(
      `Min Nominator Bond: ${balanceToJoy(constants.minNominatorBond)} JOY`
    )
    console.log(`Validator Count Target: ${constants.validatorCount}`)

    // Get min active bond
    console.log('\n💰 MINIMUM ACTIVE BOND')
    console.log('-'.repeat(50))
    const minBondInfo = await staking.getMinActiveBond()
    if (minBondInfo) {
      console.log(
        `Min to be Active: ${balanceToJoy(minBondInfo.minBond).toLocaleString()} JOY`
      )
      console.log(`Active Nominators: ${minBondInfo.activeNominators}`)
      console.log(`Max Nominators: ${minBondInfo.maxNominators}`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ All real data retrieved successfully!')
    console.log('='.repeat(50))

    // Disconnect
    await api.disconnect()
    console.log('\n👋 Disconnected from network')
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
