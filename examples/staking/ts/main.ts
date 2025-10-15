import { ApiPromise } from '@polkadot/api'
import { TxManager } from '@joystream/sdk-core/tx'
import { KeyManager } from '@joystream/sdk-core/keys'
import { StakingManager } from '@joystream/sdk-core/staking'
import { createApi } from '@joystream/sdk-core/chain'
import { joyToHapi, hapiToJoy } from '@joystream/sdk-core/assets'

type Context = {
  tx: TxManager
  keys: KeyManager
  api: ApiPromise
  staking: StakingManager
}

async function stakingExample({ tx, keys, api, staking }: Context) {
  console.log('=== Joystream Staking Example ===\n')

  const alice = keys.byName('Alice').address
  const bob = keys.byName('Bob').address

  // 1. Get staking parameters
  console.log('1. Getting staking parameters...')
  const params = await staking.getStakingParams()
  console.log(`   Minimum bond: ${hapiToJoy(params.minBond)} JOY`)
  console.log(`   Bonding duration: ${params.bondingDuration} eras`)
  console.log(`   Max nominations: ${params.maxNominations}\n`)

  // 2. Get current validators
  console.log('2. Getting active validators...')
  const validators = await staking.getValidators()
  console.log(`   Found ${validators.length} active validators:`)
  validators.slice(0, 3).forEach((validator, i) => {
    console.log(`   ${i + 1}. ${validator.account}`)
    console.log(`      Commission: ${validator.commission.toFixed(2)}%`)
    console.log(`      Total stake: ${hapiToJoy(validator.totalStake)} JOY`)
    console.log(`      Nominators: ${validator.nominatorCount}`)
  })
  console.log()

  // 3. Check if Alice can bond
  console.log('3. Checking if Alice can bond...')
  const bondAmount = joyToHapi(100) // 100 JOY
  const canBond = await staking.canBond(alice, bondAmount)
  if (canBond.canBond) {
    console.log(`   ✅ Alice can bond ${hapiToJoy(bondAmount)} JOY`)
  } else {
    console.log(`   ❌ Alice cannot bond: ${canBond.reason}`)
    return
  }

  // 4. Bond Alice's funds
  console.log("\n4. Bonding Alice's funds...")
  const bondTx = staking.bond(alice, alice, bondAmount, 'Staked')

  try {
    await tx
      .run(bondTx, alice)
      .once('signed', () => console.log('   ✅ Bond transaction signed'))
      .once('sent', () => console.log('   ✅ Bond transaction sent'))
      .once('in_block', () => console.log('   ✅ Bond transaction in block'))
      .once('finalized', () => console.log('   ✅ Bond transaction finalized'))
      .finalized()

    console.log(`   Successfully bonded ${hapiToJoy(bondAmount)} JOY`)
  } catch (error) {
    console.log(`   ❌ Bonding failed: ${error}`)
    return
  }

  // 5. Get Alice's staking info
  console.log("\n5. Getting Alice's staking information...")
  const stakingInfo = await staking.getStakingInfo(alice)
  if (stakingInfo) {
    console.log(`   Controller: ${stakingInfo.controller}`)
    console.log(`   Stash: ${stakingInfo.stash}`)
    console.log(`   Bonded: ${hapiToJoy(stakingInfo.bonded)} JOY`)
    console.log(`   Unbonding: ${hapiToJoy(stakingInfo.unbonding)} JOY`)
    console.log(`   Withdrawable: ${hapiToJoy(stakingInfo.withdrawable)} JOY`)
    console.log(`   Nominations: ${stakingInfo.nominations.length}`)
    console.log(`   Payee: ${stakingInfo.payee}`)
  }

  // 6. Nominate validators (if any available)
  if (validators.length > 0) {
    console.log('\n6. Nominating validators...')
    const nominees = validators
      .slice(0, Math.min(3, params.maxNominations))
      .map((v) => v.account)
    const nominateTx = staking.nominate(nominees)

    try {
      await tx
        .run(nominateTx, alice)
        .once('signed', () => console.log('   ✅ Nominate transaction signed'))
        .once('sent', () => console.log('   ✅ Nominate transaction sent'))
        .once('in_block', () =>
          console.log('   ✅ Nominate transaction in block')
        )
        .once('finalized', () =>
          console.log('   ✅ Nominate transaction finalized')
        )
        .finalized()

      console.log(`   Successfully nominated ${nominees.length} validators`)
    } catch (error) {
      console.log(`   ❌ Nomination failed: ${error}`)
    }
  }

  // 7. Check unbonding eligibility
  console.log('\n7. Checking unbonding eligibility...')
  const unbondAmount = joyToHapi(50) // 50 JOY
  const canUnbond = await staking.canUnbond(alice, unbondAmount)
  if (canUnbond.canUnbond) {
    console.log(`   ✅ Alice can unbond ${hapiToJoy(unbondAmount)} JOY`)

    // 8. Unbond some funds
    console.log('\n8. Unbonding some funds...')
    const unbondTx = staking.unbond(unbondAmount)

    try {
      await tx
        .run(unbondTx, alice)
        .once('signed', () => console.log('   ✅ Unbond transaction signed'))
        .once('sent', () => console.log('   ✅ Unbond transaction sent'))
        .once('in_block', () =>
          console.log('   ✅ Unbond transaction in block')
        )
        .once('finalized', () =>
          console.log('   ✅ Unbond transaction finalized')
        )
        .finalized()

      console.log(`   Successfully unbonded ${hapiToJoy(unbondAmount)} JOY`)
    } catch (error) {
      console.log(`   ❌ Unbonding failed: ${error}`)
    }
  } else {
    console.log(`   ❌ Alice cannot unbond: ${canUnbond.reason}`)
  }

  // 9. Get unbonding information
  console.log('\n9. Getting unbonding information...')
  const unbondingInfo = await staking.getUnbondingInfo(alice)
  console.log(`   Unbonding amount: ${hapiToJoy(unbondingInfo.amount)} JOY`)
  console.log(`   Unbonding eras: ${unbondingInfo.eras.join(', ')}`)

  // 10. Get current era and rewards
  console.log('\n10. Getting current era information...')
  const currentEra = await api.query.staking.currentEra()
  console.log(`   Current era: ${currentEra.toNumber()}`)

  const rewards = await staking.getStakingRewards(currentEra.toNumber())
  if (rewards) {
    console.log(`   Total rewards: ${hapiToJoy(rewards.totalRewards)} JOY`)
    console.log(
      `   Validator rewards: ${hapiToJoy(rewards.validatorRewards)} JOY`
    )
    console.log(
      `   Nominator rewards: ${hapiToJoy(rewards.nominatorRewards)} JOY`
    )
  }

  console.log('\n=== Staking Example Complete ===')
}

async function main() {
  const keys = new KeyManager({ keyringOptions: { isDev: true } })
  const api = await createApi(`ws://localhost:9944`)
  const tx = new TxManager(api, keys)
  const staking = new StakingManager(api)

  const context = { keys, api, tx, staking }

  await stakingExample(context)

  console.log('Done')
}

main()
  .then(() => process.exit())
  .catch(console.error)
