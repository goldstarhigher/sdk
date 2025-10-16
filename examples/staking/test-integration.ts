import { KeyManager } from '@joystream/sdk-core/keys'
import { StakingManager } from '@joystream/sdk-core/staking'
import { createApi } from '@joystream/sdk-core/chain'
import { joyToHapi, hapiToJoy } from '@joystream/sdk-core/assets'

async function testStakingIntegration() {
  console.log('🧪 Testing Staking Integration...\n')

  try {
    // Connect to test node
    const api = await createApi('ws://localhost:9944')
    const keys = new KeyManager({ keyringOptions: { isDev: true } })
    const staking = new StakingManager(api)

    console.log('✅ Connected to test node')

    // Test 1: Get staking parameters
    console.log('\n📊 Testing staking parameters...')
    const params = await staking.getStakingParams()
    console.log(`   Min bond: ${hapiToJoy(params.minBond)} JOY`)
    console.log(`   Bonding duration: ${params.bondingDuration} eras`)
    console.log(`   Max nominations: ${params.maxNominations}`)

    // Test 2: Get validators
    console.log('\n👥 Testing validator queries...')
    const validators = await staking.getValidators()
    console.log(`   Found ${validators.length} validators`)

    if (validators.length > 0) {
      const validator = validators[0]
      console.log(`   Sample validator: ${validator.account}`)
      console.log(`   Commission: ${validator.commission.toFixed(2)}%`)
    }

    // Test 3: Test bond eligibility
    console.log('\n💰 Testing bond eligibility...')
    const alice = keys.byName('Alice').address
    const bondAmount = joyToHapi(100) // 100 JOY

    const canBond = await staking.canBond(alice, bondAmount)
    console.log(`   Alice can bond: ${canBond.canBond}`)
    if (!canBond.canBond) {
      console.log(`   Reason: ${canBond.reason}`)
    }

    // Test 4: Test extrinsic creation
    console.log('\n🔧 Testing extrinsic creation...')
    const bondTx = staking.bond(alice, alice, bondAmount, 'Staked')
    console.log(
      `   Bond extrinsic created: ${bondTx.method.section}.${bondTx.method.method}`
    )

    const unbondTx = staking.unbond(joyToHapi(50))
    console.log(
      `   Unbond extrinsic created: ${unbondTx.method.section}.${unbondTx.method.method}`
    )

    // Test 5: Test staking info query
    console.log('\n📋 Testing staking info query...')
    const stakingInfo = await staking.getStakingInfo(alice)
    if (stakingInfo) {
      console.log(
        `   Alice has staking info: ${hapiToJoy(stakingInfo.bonded)} JOY bonded`
      )
    } else {
      console.log('   Alice has no staking info (not bonded)')
    }

    // Test 6: Test unbonding info
    console.log('\n⏳ Testing unbonding info...')
    const unbondingInfo = await staking.getUnbondingInfo(alice)
    console.log(`   Unbonding amount: ${hapiToJoy(unbondingInfo.amount)} JOY`)
    console.log(`   Unbonding eras: ${unbondingInfo.eras.length}`)

    console.log('\n✅ All integration tests passed!')

    await api.disconnect()
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    process.exit(1)
  }
}

// Run the test
testStakingIntegration()
  .then(() => {
    console.log('\n🎉 Integration testing complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Integration test error:', error)
    process.exit(1)
  })
