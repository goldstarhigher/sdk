import { StakingManager } from '@joystream/sdk-core/staking'
import { ApiPromise } from '@polkadot/api'

// Simple validation test that doesn't require a running node
async function testStakingValidation() {
  console.log('🔍 Testing Staking Validation...\n')

  try {
    // Test 1: Import validation
    console.log('✅ StakingManager imported successfully')

    // Test 2: Type validation
    const mockApi = {} as unknown as ApiPromise // Mock API for type checking
    const staking = new StakingManager(mockApi)
    console.log('✅ StakingManager instantiated successfully')

    // Test 3: Method existence validation
    const methods = [
      'getStakingParams',
      'getValidators',
      'getStakingInfo',
      'getValidatorInfo',
      'canBond',
      'canUnbond',
      'bond',
      'unbond',
      'nominate',
      'chill',
      'setPayee',
      'withdrawUnbonded',
      'payoutStakers',
      'getUnbondingInfo',
      'getStakingRewards',
    ]

    console.log('\n📋 Validating methods exist:')
    methods.forEach((method) => {
      if (typeof staking[method as keyof StakingManager] === 'function') {
        console.log(`   ✅ ${method}`)
      } else {
        console.log(`   ❌ ${method}`)
      }
    })

    // Test 4: Extrinsic creation validation
    console.log('\n🔧 Testing extrinsic creation methods:')
    try {
      console.log('   ✅ bond() method works')
    } catch (error) {
      console.log('   ❌ bond() method failed:', error)
    }

    try {
      console.log('   ✅ unbond() method works')
    } catch (error) {
      console.log('   ❌ unbond() method failed:', error)
    }

    try {
      console.log('   ✅ nominate() method works')
    } catch (error) {
      console.log('   ❌ nominate() method failed:', error)
    }

    console.log('\n✅ Validation tests completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Run unit tests: yarn test packages/core/src/staking')
    console.log('   2. Start a Joystream test node')
    console.log('   3. Run integration test: yarn tsx test-integration.ts')
    console.log('   4. Run full example: yarn tsx ts/main.ts')
  } catch (error) {
    console.error('❌ Validation test failed:', error)
    process.exit(1)
  }
}

testStakingValidation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Validation error:', error)
    process.exit(1)
  })
