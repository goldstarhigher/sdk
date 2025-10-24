/**
 * Complete Staking Extrinsics Demo
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
  console.log('🎯 COMPLETE STAKING EXTRINSICS DEMO')
  console.log('='.repeat(70))
  console.log(`Connecting to: ${RPC_ENDPOINT}\n`)

  const provider = new WsProvider(RPC_ENDPOINT)
  const api = await ApiPromise.create({ provider })

  console.log(`✅ Connected to: ${await api.rpc.system.chain()}`)
  console.log(`Version: ${(await api.rpc.system.version()).toString()}`)
  console.log('='.repeat(70))

  // Initialize keyring (for transaction examples)
  const keyring = new Keyring({ type: 'sr25519' })
  const account = keyring.addFromMnemonic(MNEMONIC)
  console.log(`\n📝 Account: ${account.address}`)

  // Create staking manager
  const staking = new StakingManager(api)

  // ====================================================================
  // SECTION 1: BONDING OPERATIONS
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('🔒 BONDING OPERATIONS')
  console.log('='.repeat(70))

  // 1. Bond tokens
  console.log('\n1️⃣  bond(stash, controller, amount, payee)')
  console.log('   Purpose: Lock tokens for staking')
  const bondTx = staking.bond(
    account.address, // stash
    account.address, // controller
    joyToBalance(1000), // 1000 JOY
    'Staked' // reward destination
  )
  console.log(`   ✅ Created: ${bondTx.method.section}.${bondTx.method.method}`)
  console.log(`   Args: controller, amount=${1000} JOY, payee=Staked`)
  console.log(`   Usage: await bondTx.signAndSend(account)`)

  // 2. Bond extra tokens
  console.log('\n2️⃣  bondExtra(amount)')
  console.log('   Purpose: Add more tokens to existing bond')
  const bondExtraTx = staking.bondExtra(joyToBalance(500))
  console.log(
    `   ✅ Created: ${bondExtraTx.method.section}.${bondExtraTx.method.method}`
  )
  console.log(`   Args: amount=${500} JOY`)

  // 3. Unbond tokens
  console.log('\n3️⃣  unbond(amount)')
  console.log('   Purpose: Schedule tokens for unbonding (28 era wait)')
  const unbondTx = staking.unbond(joyToBalance(300))
  console.log(
    `   ✅ Created: ${unbondTx.method.section}.${unbondTx.method.method}`
  )
  console.log(`   Args: amount=${300} JOY`)

  // 4. Rebond tokens
  console.log('\n4️⃣  rebond(amount)')
  console.log('   Purpose: Cancel unbonding and rebond tokens')
  const rebondTx = staking.rebond(joyToBalance(100))
  console.log(
    `   ✅ Created: ${rebondTx.method.section}.${rebondTx.method.method}`
  )
  console.log(`   Args: amount=${100} JOY`)

  // 5. Withdraw unbonded
  console.log('\n5️⃣  withdrawUnbonded(numSlashingSpans?)')
  console.log('   Purpose: Withdraw tokens after unbonding period')
  const withdrawTx = staking.withdrawUnbonded(0)
  console.log(
    `   ✅ Created: ${withdrawTx.method.section}.${withdrawTx.method.method}`
  )
  console.log(`   Args: numSlashingSpans=0`)

  // ====================================================================
  // SECTION 2: NOMINATION & VALIDATION
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('🗳️  NOMINATION & VALIDATION')
  console.log('='.repeat(70))

  // Get real validators for examples
  const validators = await staking.getValidators()
  const targetValidators = validators.slice(0, 3).map((v) => v.account)

  // 6. Nominate validators
  console.log('\n6️⃣  nominate(targets)')
  console.log('   Purpose: Nominate validators to support')
  const nominateTx = staking.nominate(targetValidators)
  console.log(
    `   ✅ Created: ${nominateTx.method.section}.${nominateTx.method.method}`
  )
  console.log(`   Args: ${targetValidators.length} validator addresses`)
  console.log(`   Validators:`)
  targetValidators.forEach((v, i) => console.log(`     ${i + 1}. ${v}`))

  // 7. Validate (become a validator)
  console.log('\n7️⃣  validate(commission, blocked?)')
  console.log('   Purpose: Declare intention to validate blocks')
  const validateTx = staking.validate(5, false) // 5% commission
  console.log(
    `   ✅ Created: ${validateTx.method.section}.${validateTx.method.method}`
  )
  console.log(`   Args: commission=5%, blocked=false`)

  // 8. Chill (stop nominating/validating)
  console.log('\n8️⃣  chill()')
  console.log('   Purpose: Stop all staking activities')
  const chillTx = staking.chill()
  console.log(
    `   ✅ Created: ${chillTx.method.section}.${chillTx.method.method}`
  )
  console.log(`   Args: none`)

  // ====================================================================
  // SECTION 3: ACCOUNT MANAGEMENT
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('⚙️  ACCOUNT MANAGEMENT')
  console.log('='.repeat(70))

  // 9. Set controller
  console.log('\n9️⃣  setController(controller)')
  console.log('   Purpose: Change the controller account')
  const setControllerTx = staking.setController(account.address)
  console.log(
    `   ✅ Created: ${setControllerTx.method.section}.${setControllerTx.method.method}`
  )
  console.log(`   Args: controller=${account.address.slice(0, 20)}...`)

  // 10. Set payee
  console.log('\n🔟 setPayee(payee)')
  console.log('   Purpose: Set reward destination')
  const setPayeeTx = staking.setPayee('Staked')
  console.log(
    `   ✅ Created: ${setPayeeTx.method.section}.${setPayeeTx.method.method}`
  )
  console.log(`   Args: payee=Staked`)
  console.log(`   Options: 'Staked', 'Stash', 'Controller', or account address`)

  // ====================================================================
  // SECTION 4: REWARDS
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('💰 REWARDS')
  console.log('='.repeat(70))

  // 11. Payout stakers
  console.log('\n1️⃣1️⃣  payoutStakers(validator, era)')
  console.log('   Purpose: Trigger reward payout for an era')
  if (validators.length > 0) {
    const payoutTx = staking.payoutStakers(validators[0].account, 1000)
    console.log(
      `   ✅ Created: ${payoutTx.method.section}.${payoutTx.method.method}`
    )
    console.log(
      `   Args: validator=${validators[0].account.slice(0, 20)}..., era=1000`
    )
  }

  // 12. Payout stakers by page
  console.log('\n1️⃣2️⃣  payoutStakersByPage(validator, era, page)')
  console.log('   Purpose: Payout rewards for specific nominator page')
  if (validators.length > 0) {
    const payoutPageTx = staking.payoutStakersByPage(
      validators[0].account,
      1000,
      0
    )
    console.log(
      `   ✅ Created: ${payoutPageTx.method.section}.${payoutPageTx.method.method}`
    )
    console.log(`   Args: validator, era=1000, page=0`)
  }

  // ====================================================================
  // SECTION 5: BAGS LIST (Advanced)
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('📊 BAGS LIST OPERATIONS')
  console.log('='.repeat(70))

  // 13. Rebag
  console.log('\n1️⃣3️⃣  rebag(account)')
  console.log('   Purpose: Move account to correct bag based on stake')
  const rebagTx = staking.rebag(account.address)
  console.log(
    `   ✅ Created: ${rebagTx.method.section}.${rebagTx.method.method}`
  )
  console.log(`   Args: account=${account.address.slice(0, 20)}...`)

  // 14. Put in front of
  console.log('\n1️⃣4️⃣  putInFrontOf(lighter)')
  console.log('   Purpose: Reposition account within its bag')
  const putInFrontTx = staking.putInFrontOf(account.address)
  console.log(
    `   ✅ Created: ${putInFrontTx.method.section}.${putInFrontTx.method.method}`
  )
  console.log(`   Args: lighter=${account.address.slice(0, 20)}...`)

  // ====================================================================
  // SECTION 6: BATCH OPERATIONS
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('📦 BATCH OPERATIONS')
  console.log('='.repeat(70))

  // 15. Bond and nominate (combined)
  console.log('\n1️⃣5️⃣  bondAndNominate(controller, amount, targets, payee)')
  console.log('   Purpose: Bond and nominate in single transaction')
  const batchTx = staking.bondAndNominate(
    account.address,
    joyToBalance(1000),
    targetValidators,
    'Staked'
  )
  console.log(
    `   ✅ Created: ${batchTx.method.section}.${batchTx.method.method}`
  )
  console.log(`   Contains: bond() + nominate()`)
  console.log(
    `   Args: amount=${1000} JOY, ${targetValidators.length} validators`
  )

  // ====================================================================
  // SECTION 7: VALIDATION HELPERS
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('✅ VALIDATION HELPERS')
  console.log('='.repeat(70))

  console.log(
    '\nValidation helpers check if operations are valid before submitting:'
  )

  // Check if can bond
  const bondCheck = await staking.canBond(account.address, joyToBalance(1000))
  console.log(`\n• canBond(account, 1000 JOY):`)
  console.log(`  Result: ${bondCheck.canBond ? '✅ Yes' : '❌ No'}`)
  if (!bondCheck.canBond) console.log(`  Reason: ${bondCheck.reason}`)

  // Check if can nominate
  const nominateCheck = await staking.canNominate(
    account.address,
    targetValidators
  )
  console.log(
    `\n• canNominate(account, ${targetValidators.length} validators):`
  )
  console.log(`  Result: ${nominateCheck.canNominate ? '✅ Yes' : '❌ No'}`)
  if (!nominateCheck.canNominate)
    console.log(`  Reason: ${nominateCheck.reason}`)

  // Check if can validate
  const validateCheck = await staking.canValidate(account.address, 5)
  console.log(`\n• canValidate(account, 5% commission):`)
  console.log(`  Result: ${validateCheck.canValidate ? '✅ Yes' : '❌ No'}`)
  if (!validateCheck.canValidate)
    console.log(`  Reason: ${validateCheck.reason}`)

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log('\n' + '='.repeat(70))
  console.log('📋 SUMMARY')
  console.log('='.repeat(70))
  console.log('\n✅ ALL 15 STAKING EXTRINSICS AVAILABLE:')
  console.log('\nBonding Operations (5):')
  console.log('  1. bond() - Initial bond')
  console.log('  2. bondExtra() - Add to bond')
  console.log('  3. unbond() - Schedule unbonding')
  console.log('  4. rebond() - Cancel unbonding')
  console.log('  5. withdrawUnbonded() - Claim unbonded')
  console.log('\nNomination & Validation (3):')
  console.log('  6. nominate() - Nominate validators')
  console.log('  7. validate() - Become validator')
  console.log('  8. chill() - Stop staking')
  console.log('\nAccount Management (2):')
  console.log('  9. setController() - Change controller')
  console.log(' 10. setPayee() - Set rewards destination')
  console.log('\nRewards (2):')
  console.log(' 11. payoutStakers() - Claim rewards')
  console.log(' 12. payoutStakersByPage() - Claim by page')
  console.log('\nBags List (2):')
  console.log(' 13. rebag() - Move to correct bag')
  console.log(' 14. putInFrontOf() - Reposition in bag')
  console.log('\nBatch Operations (1):')
  console.log(' 15. bondAndNominate() - Combined operation')

  console.log('\n' + '='.repeat(70))
  console.log('💡 TO SUBMIT TRANSACTIONS:')
  console.log('='.repeat(70))
  console.log('\n1. Use a real mnemonic:')
  console.log('   MNEMONIC="your seed phrase" yarn tsx test-all-extrinsics.ts')
  console.log('\n2. Sign and send:')
  console.log('   await tx.signAndSend(account, ({ status }) => {')
  console.log('     if (status.isInBlock) console.log("In block!")')
  console.log('   })')
  console.log('\n3. With validation:')
  console.log(
    '   const { canBond, reason } = await staking.canBond(account, amount)'
  )
  console.log('   if (canBond) {')
  console.log('     await staking.bond(...).signAndSend(account)')
  console.log('   }')

  console.log('\n' + '='.repeat(70))
  console.log('🎉 Demo Complete!')
  console.log('='.repeat(70))

  await api.disconnect()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
