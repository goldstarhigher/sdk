# Staking Module

The Staking module provides comprehensive functionality for interacting with the Substrate staking pallet, including bonding, nominating, validating, and querying staking information.

## Features

- **Bonding Operations**: Bond, unbond, rebond, and withdraw unbonded tokens
- **Nomination**: Nominate validators and manage nominations
- **Validation**: Become a validator and manage validator settings
- **Rewards**: Query and claim staking rewards
- **Bags List**: Rebag and reposition accounts in the bags list
- **Comprehensive Queries**: Get detailed staking information for accounts, validators, and the network

## Usage

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api'
import { StakingManager } from '@joystream/sdk/staking'

// Connect to the chain
const provider = new WsProvider('wss://rpc.joystream.org')
const api = await ApiPromise.create({ provider })

// Create staking manager
const staking = new StakingManager(api)

// Get staking information for an account
const stakingInfo = await staking.getStakingInfo(controllerAddress)
console.log(`Bonded: ${stakingInfo?.bonded} JOY`)
console.log(`Unbonding: ${stakingInfo?.unbonding} JOY`)
console.log(`Nominations: ${stakingInfo?.nominations}`)

// Get list of active validators
const validators = await staking.getValidators()
console.log(`Active validators: ${validators.length}`)

// Get waiting validators
const waiting = await staking.getWaitingValidators()
console.log(`Waiting validators: ${waiting.length}`)
```

## Extrinsics

### Bonding Operations

#### Bond tokens

```typescript
// Bond tokens with a controller account
const bondTx = staking.bond(
  stashAddress,
  controllerAddress,
  amountInPlanck, // Amount in smallest unit (e.g., 1 JOY = 10^10 planck)
  'Staked' // Reward destination: 'Staked' | 'Stash' | 'Controller' | accountAddress
)

// Submit the transaction
await bondTx.signAndSend(account, ({ status }) => {
  if (status.isInBlock) {
    console.log(`Bonded ${amount} tokens`)
  }
})
```

#### Bond additional tokens

```typescript
const bondExtraTx = staking.bondExtra(additionalAmount)
await bondExtraTx.signAndSend(account)
```

#### Unbond tokens

```typescript
const unbondTx = staking.unbond(amountToUnbond)
await unbondTx.signAndSend(account)
```

#### Rebond previously unbonded tokens

```typescript
const rebondTx = staking.rebond(amountToRebond)
await rebondTx.signAndSend(account)
```

#### Withdraw unbonded tokens

```typescript
// After unbonding period has passed
const withdrawTx = staking.withdrawUnbonded()
await withdrawTx.signAndSend(account)
```

### Nomination

#### Nominate validators

```typescript
const targets = [
  '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
  '5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc',
]

const nominateTx = staking.nominate(targets)
await nominateTx.signAndSend(account)
```

#### Check if can nominate

```typescript
const { canNominate, reason } = await staking.canNominate(account, targets)
if (!canNominate) {
  console.error(`Cannot nominate: ${reason}`)
}
```

#### Get current nominations

```typescript
const targets = await staking.getNominatorTargets(nominatorAddress)
if (targets) {
  targets.forEach((target) => {
    console.log(`Validator: ${target.validator}`)
    console.log(`Stake: ${target.stake}`)
    console.log(`Active: ${target.isActive}`)
  })
}
```

#### Stop nominating

```typescript
const chillTx = staking.chill()
await chillTx.signAndSend(account)
```

### Validation

#### Become a validator

```typescript
const commission = 10 // 10% commission
const validateTx = staking.validate(commission, false) // false = not blocking nominations
await validateTx.signAndSend(account)
```

#### Check if can validate

```typescript
const { canValidate, reason } = await staking.canValidate(account, commission)
if (!canValidate) {
  console.error(`Cannot validate: ${reason}`)
}
```

#### Get validator preferences

```typescript
const prefs = await staking.getValidatorPrefs(validatorAddress)
console.log(`Commission: ${prefs?.commission}%`)
console.log(`Blocked: ${prefs?.blocked}`)
```

### Rewards

#### Claim rewards

```typescript
const payoutTx = staking.payoutStakers(validatorAddress, eraIndex)
await payoutTx.signAndSend(account)
```

#### Get rewards information

```typescript
const rewards = await staking.getStakingRewards(eraIndex)
if (rewards) {
  console.log(`Total rewards: ${rewards.totalRewards}`)
  console.log(`Validator rewards: ${rewards.validatorRewards}`)
  console.log(`Nominator rewards: ${rewards.nominatorRewards}`)
}
```

#### Set reward destination

```typescript
const setPayeeTx = staking.setPayee('Staked') // or 'Stash', 'Controller', or account address
await setPayeeTx.signAndSend(account)
```

### Account Management

#### Set controller account

```typescript
const setControllerTx = staking.setController(newControllerAddress)
await setControllerTx.signAndSend(account)
```

### Bags List Operations

#### Rebag account

```typescript
const rebagTx = staking.rebag(accountAddress)
await rebagTx.signAndSend(account)
```

#### Reposition in bag

```typescript
const putInFrontTx = staking.putInFrontOf(lighterAccountAddress)
await putInFrontTx.signAndSend(account)
```

### Batch Operations

#### Bond and nominate in one transaction

```typescript
const batchTx = staking.bondAndNominate(
  controllerAddress,
  bondAmount,
  targets,
  'Staked'
)
await batchTx.signAndSend(account)
```

## Queries

### Account Information

#### Get comprehensive staking info

```typescript
const info = await staking.getStakingInfo(controllerAddress)
if (info) {
  console.log(`Controller: ${info.controller}`)
  console.log(`Stash: ${info.stash}`)
  console.log(`Bonded: ${info.bonded}`)
  console.log(`Unbonding: ${info.unbonding}`)
  console.log(`Withdrawable: ${info.withdrawable}`)
  console.log(`Nominations: ${info.nominations}`)
  console.log(`Payee: ${info.payee}`)
}
```

#### Get unbonding information

```typescript
const unbonding = await staking.getUnbondingInfo(controllerAddress)
console.log(`Unbonding amount: ${unbonding.amount}`)
console.log(`Eras: ${unbonding.eras}`)
```

#### Get slashing spans

```typescript
const spans = await staking.getSlashingSpans(stashAddress)
if (spans) {
  console.log(`Last non-zero slash: ${spans.lastNonzeroSlash}`)
  console.log(`Prior slashes: ${spans.prior}`)
}
```

### Validator Information

#### Get validator info

```typescript
const validator = await staking.getValidatorInfo(validatorAddress)
if (validator) {
  console.log(`Commission: ${validator.commission}%`)
  console.log(`Total stake: ${validator.totalStake}`)
  console.log(`Own stake: ${validator.ownStake}`)
  console.log(`Nominators: ${validator.nominatorCount}`)
  console.log(`Era points: ${validator.eraPoints}`)
  console.log(`Active: ${validator.isActive}`)
}
```

#### Get all active validators

```typescript
const validators = await staking.getValidators()
validators.forEach((v) => {
  console.log(
    `${v.account}: ${v.totalStake} stake, ${v.commission}% commission`
  )
})
```

#### Get waiting validators

```typescript
const waiting = await staking.getWaitingValidators()
waiting.forEach((v) => {
  console.log(`${v.account}: ${v.totalStake} stake (waiting)`)
})
```

### Network Information

#### Get staking parameters

```typescript
const params = await staking.getStakingParams()
console.log(`Min bond: ${params.minBond}`)
console.log(`Bonding duration: ${params.bondingDuration} eras`)
console.log(`Max nominations: ${params.maxNominations}`)
console.log(`History depth: ${params.historyDepth}`)
```

#### Get all staking constants

```typescript
const constants = await staking.getStakingConstants()
console.log(`Bonding duration: ${constants.bondingDuration} eras`)
console.log(`Sessions per era: ${constants.sessionsPerEra}`)
console.log(`Min validator bond: ${constants.minValidatorBond}`)
console.log(`Min nominator bond: ${constants.minNominatorBond}`)
console.log(`Validator count: ${constants.validatorCount}`)
```

#### Get minimum active bond

```typescript
const minBondInfo = await staking.getMinActiveBond()
if (minBondInfo) {
  console.log(`Min active bond: ${minBondInfo.minBond}`)
  console.log(`Active nominators: ${minBondInfo.activeNominators}`)
  console.log(`Max nominators: ${minBondInfo.maxNominators}`)
}
```

## Validation Helpers

### Check if can bond

```typescript
const { canBond, reason } = await staking.canBond(account, amount)
if (!canBond) {
  console.error(`Cannot bond: ${reason}`)
}
```

### Check if can unbond

```typescript
const { canUnbond, reason } = await staking.canUnbond(controller, amount)
if (!canUnbond) {
  console.error(`Cannot unbond: ${reason}`)
}
```

### Check if can nominate

```typescript
const { canNominate, reason } = await staking.canNominate(account, targets)
if (!canNominate) {
  console.error(`Cannot nominate: ${reason}`)
}
```

### Check if can validate

```typescript
const { canValidate, reason } = await staking.canValidate(account, commission)
if (!canValidate) {
  console.error(`Cannot validate: ${reason}`)
}
```

## Utility Functions

### Convert JOY to Planck

```typescript
import { joyToBalance } from '@joystream/sdk/staking'

const joyAmount = 100 // 100 JOY
const planckAmount = joyToBalance(joyAmount) // 1000000000000n (10^12)
```

### Convert Planck to JOY

```typescript
import { balanceToJoy } from '@joystream/sdk/staking'

const planckAmount = 1000000000000n
const joyAmount = balanceToJoy(planckAmount) // 100
```

## Examples

### Example 1: Bond and Nominate

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api'
import { StakingManager, joyToBalance } from '@joystream/sdk/staking'

async function bondAndNominate() {
  const provider = new WsProvider('wss://rpc.joystream.org')
  const api = await ApiPromise.create({ provider })
  const staking = new StakingManager(api)

  const amount = joyToBalance(1000) // 1000 JOY
  const targets = [
    '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    '5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc',
  ]

  // Check if can bond
  const { canBond, reason } = await staking.canBond(account, amount)
  if (!canBond) {
    console.error(`Cannot bond: ${reason}`)
    return
  }

  // Check if can nominate
  const { canNominate, reason: nomReason } = await staking.canNominate(
    account,
    targets
  )
  if (!canNominate) {
    console.error(`Cannot nominate: ${nomReason}`)
    return
  }

  // Create batch transaction
  const tx = staking.bondAndNominate(account, amount, targets, 'Staked')

  // Sign and send
  await tx.signAndSend(keyring.getPair(account), ({ status }) => {
    if (status.isInBlock) {
      console.log('Bonded and nominated successfully!')
    }
  })
}
```

### Example 2: Become a Validator

```typescript
async function becomeValidator() {
  const provider = new WsProvider('wss://rpc.joystream.org')
  const api = await ApiPromise.create({ provider })
  const staking = new StakingManager(api)

  const commission = 5 // 5% commission

  // Check if can validate
  const { canValidate, reason } = await staking.canValidate(account, commission)
  if (!canValidate) {
    console.error(`Cannot validate: ${reason}`)
    return
  }

  // First, bond tokens if not already bonded
  const bondAmount = joyToBalance(10000) // 10,000 JOY
  const bondTx = staking.bond(account, account, bondAmount, 'Staked')
  await bondTx.signAndSend(keyring.getPair(account))

  // Then declare intention to validate
  const validateTx = staking.validate(commission, false)
  await validateTx.signAndSend(keyring.getPair(account), ({ status }) => {
    if (status.isInBlock) {
      console.log('Successfully declared intention to validate!')
    }
  })
}
```

### Example 3: Manage Unbonding

```typescript
async function manageUnbonding() {
  const provider = new WsProvider('wss://rpc.joystream.org')
  const api = await ApiPromise.create({ provider })
  const staking = new StakingManager(api)

  // Get current unbonding info
  const unbonding = await staking.getUnbondingInfo(controllerAddress)
  console.log(`Currently unbonding: ${balanceToJoy(unbonding.amount)} JOY`)
  console.log(`Will be available in eras: ${unbonding.eras}`)

  // Get staking info to check withdrawable
  const info = await staking.getStakingInfo(controllerAddress)
  if (info && info.withdrawable > 0n) {
    console.log(`Can withdraw: ${balanceToJoy(info.withdrawable)} JOY`)

    // Withdraw unbonded tokens
    const withdrawTx = staking.withdrawUnbonded()
    await withdrawTx.signAndSend(keyring.getPair(account), ({ status }) => {
      if (status.isInBlock) {
        console.log('Withdrawn unbonded tokens!')
      }
    })
  }
}
```

### Example 4: Query Validator Information

```typescript
async function getValidatorStats() {
  const provider = new WsProvider('wss://rpc.joystream.org')
  const api = await ApiPromise.create({ provider })
  const staking = new StakingManager(api)

  // Get all active validators
  const validators = await staking.getValidators()

  // Sort by total stake
  validators.sort((a, b) => (a.totalStake > b.totalStake ? -1 : 1))

  console.log('Top 10 Validators by Stake:')
  validators.slice(0, 10).forEach((v, i) => {
    console.log(`${i + 1}. ${v.account}`)
    console.log(`   Stake: ${balanceToJoy(v.totalStake)} JOY`)
    console.log(`   Commission: ${v.commission}%`)
    console.log(`   Nominators: ${v.nominatorCount}`)
    console.log(`   Era Points: ${v.eraPoints}`)
  })

  // Get waiting validators
  const waiting = await staking.getWaitingValidators()
  console.log(`\nWaiting validators: ${waiting.length}`)
}
```

## Types

All TypeScript types are exported from the module:

```typescript
import type {
  StakingInfo,
  ValidatorInfo,
  StakingParams,
  StakingRewards,
  ValidatorPrefs,
  SlashingSpans,
  WaitingValidator,
  NominatorTarget,
  MinActiveBondInfo,
  UnbondingChunk,
  StakingExtrinsic,
} from '@joystream/sdk/staking'
```

## API Reference

See the full API documentation for detailed information about all methods and types.
