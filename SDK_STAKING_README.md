# Joystream SDK - Staking Module

## Overview

The Joystream SDK now includes a comprehensive **Staking Module** that provides full functionality for interacting with the Substrate staking pallet. This module enables developers to build staking applications with features like bonding, nominating, validating, and managing staking rewards.

## What's New

### Extrinsics (Transaction Methods)

The SDK now supports all major staking extrinsics:

#### Core Bonding Operations

- ✅ `bond()` - Bond tokens with a controller account
- ✅ `bondExtra()` - Bond additional tokens to existing bond
- ✅ `unbond()` - Schedule unbonding of tokens
- ✅ `rebond()` - **NEW** - Rebond previously unbonded tokens
- ✅ `withdrawUnbonded()` - Withdraw unbonded tokens after unbonding period

#### Nomination & Validation

- ✅ `nominate()` - Nominate validators for staking
- ✅ `chill()` - Stop nominating/validating
- ✅ `validate()` - **NEW** - Declare intention to validate with commission
- ✅ `setController()` - **NEW** - Change controller account

#### Rewards Management

- ✅ `setPayee()` - Set reward destination (Staked/Stash/Controller/Account)
- ✅ `payoutStakers()` - Trigger payout for a validator and era
- ✅ `payoutStakersByPage()` - **NEW** - Payout for specific page of nominators

#### Bags List Operations

- ✅ `rebag()` - **NEW** - Move account to correct bag based on stake
- ✅ `putInFrontOf()` - **NEW** - Reposition within a bag

#### Batch Operations

- ✅ `bondAndNominate()` - **NEW** - Combined bond and nominate in one transaction

### Query Methods

The SDK provides comprehensive query methods for staking data:

#### Account Staking Information

- ✅ `getStakingInfo()` - Comprehensive staking info for an account
- ✅ `getUnbondingInfo()` - Current unbonding chunks and eras
- ✅ `getNominatorTargets()` - **NEW** - Current nominations with exposure information
- ✅ `getSlashingSpans()` - **NEW** - Get slashing span information

#### Validator Information

- ✅ `getValidatorInfo()` - Comprehensive validator information
- ✅ `getValidators()` - List of all active validators with info
- ✅ `getWaitingValidators()` - **NEW** - Validators waiting to join active set
- ✅ `getValidatorPrefs()` - **NEW** - Get validator preferences (commission, blocked status)

#### Network Information

- ✅ `getStakingParams()` - Basic staking parameters
- ✅ `getStakingConstants()` - **NEW** - All staking constants (sessions, minimums, etc.)
- ✅ `getStakingRewards()` - Rewards breakdown for an era
- ✅ `getMinActiveBond()` - **NEW** - Minimum bond to be in active nominator set

### Validation Helpers

New validation helpers to check eligibility before submitting transactions:

- ✅ `canBond()` - Check if account can bond specified amount
- ✅ `canUnbond()` - Check if can unbond specified amount
- ✅ `canNominate()` - **NEW** - Check if can nominate specific targets
- ✅ `canValidate()` - **NEW** - Check if can become a validator

### Enhanced Type Definitions

New TypeScript types for better type safety:

```typescript
interface ValidatorPrefs {
  commission: number
  blocked?: boolean
}

interface SlashingSpans {
  lastNonzeroSlash: number
  prior: number[]
  spanIndex: number
}

interface WaitingValidator {
  account: string
  commission: number
  totalStake: bigint
  ownStake: bigint
}

interface NominatorTarget {
  validator: string
  stake: bigint
  isActive: boolean
}

interface MinActiveBondInfo {
  minBond: bigint
  activeNominators: number
  maxNominators: number
}
```

## Installation

```bash
yarn add @joystream/sdk
```

## Quick Start

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api'
import { StakingManager, joyToBalance } from '@joystream/sdk/staking'

// Connect to the chain
const provider = new WsProvider('wss://rpc.joystream.org')
const api = await ApiPromise.create({ provider })

// Create staking manager
const staking = new StakingManager(api)

// Get active validators
const validators = await staking.getValidators()
console.log(`Active validators: ${validators.length}`)

// Bond and nominate
const bondAmount = joyToBalance(1000) // 1000 JOY
const targets = validators.slice(0, 3).map((v) => v.account)

const tx = staking.bondAndNominate(account, bondAmount, targets, 'Staked')
await tx.signAndSend(account)
```

## Examples

### Example 1: Become a Nominator

```typescript
import { StakingManager, joyToBalance } from '@joystream/sdk/staking'

async function nominateValidators(api, account, keyring) {
  const staking = new StakingManager(api)

  // Get top validators by stake
  const validators = await staking.getValidators()
  validators.sort((a, b) => (a.totalStake > b.totalStake ? -1 : 1))

  // Select top 3 validators
  const targets = validators.slice(0, 3).map((v) => v.account)

  // Check if can nominate
  const { canNominate, reason } = await staking.canNominate(account, targets)
  if (!canNominate) {
    console.error(`Cannot nominate: ${reason}`)
    return
  }

  // Bond and nominate in one transaction
  const amount = joyToBalance(5000) // 5000 JOY
  const tx = staking.bondAndNominate(account, amount, targets, 'Staked')

  await tx.signAndSend(keyring.getPair(account), ({ status }) => {
    if (status.isInBlock) {
      console.log('Successfully bonded and nominated!')
    }
  })
}
```

### Example 2: Become a Validator

```typescript
async function becomeValidator(api, account, keyring) {
  const staking = new StakingManager(api)

  const commission = 5 // 5% commission

  // Check if can validate
  const { canValidate, reason } = await staking.canValidate(account, commission)
  if (!canValidate) {
    console.error(`Cannot validate: ${reason}`)
    return
  }

  // Bond tokens
  const bondAmount = joyToBalance(10000) // 10,000 JOY
  const bondTx = staking.bond(account, account, bondAmount, 'Staked')
  await bondTx.signAndSend(keyring.getPair(account))

  // Declare intention to validate
  const validateTx = staking.validate(commission, false)
  await validateTx.signAndSend(keyring.getPair(account), ({ status }) => {
    if (status.isInBlock) {
      console.log('Successfully declared intention to validate!')
    }
  })
}
```

### Example 3: Monitor Staking Status

```typescript
async function monitorStaking(api, account) {
  const staking = new StakingManager(api)

  // Get staking info
  const info = await staking.getStakingInfo(account)
  if (info) {
    console.log(`Bonded: ${balanceToJoy(info.bonded)} JOY`)
    console.log(`Unbonding: ${balanceToJoy(info.unbonding)} JOY`)
    console.log(`Withdrawable: ${balanceToJoy(info.withdrawable)} JOY`)
  }

  // Get current nominations
  const targets = await staking.getNominatorTargets(account)
  if (targets) {
    console.log('\nCurrent Nominations:')
    targets.forEach((t) => {
      console.log(
        `  ${t.validator}: ${balanceToJoy(t.stake)} JOY (${t.isActive ? 'Active' : 'Inactive'})`
      )
    })
  }

  // Get unbonding info
  const unbonding = await staking.getUnbondingInfo(account)
  if (unbonding.amount > 0n) {
    console.log(`\nUnbonding: ${balanceToJoy(unbonding.amount)} JOY`)
    console.log(`Available in eras: ${unbonding.eras.join(', ')}`)
  }
}
```

### Example 4: Manage Validator Operations

```typescript
async function manageValidator(api, validatorAccount, keyring) {
  const staking = new StakingManager(api)

  // Get validator info
  const info = await staking.getValidatorInfo(validatorAccount)
  if (info) {
    console.log(`Commission: ${info.commission}%`)
    console.log(`Total Stake: ${balanceToJoy(info.totalStake)} JOY`)
    console.log(`Nominators: ${info.nominatorCount}`)
    console.log(`Era Points: ${info.eraPoints}`)
  }

  // Get validator preferences
  const prefs = await staking.getValidatorPrefs(validatorAccount)
  if (prefs) {
    console.log(`Current commission: ${prefs.commission}%`)
    console.log(`Blocked: ${prefs.blocked}`)
  }

  // Update commission (example)
  const newCommission = 3 // 3%
  const tx = staking.validate(newCommission, false)
  await tx.signAndSend(keyring.getPair(validatorAccount))
}
```

## Documentation

- [Complete Staking Module Documentation](./packages/core/src/staking/README.md)
- [Staking Checklist](./STAKING_CHECKLIST.md) - Complete list of implemented features
- [Examples](./examples/staking/) - More code examples

## Testing

Run the staking module tests:

```bash
cd packages/core
yarn test src/staking/__tests__
```

Run the staking example:

```bash
cd examples/staking
yarn install
RPC_ENDPOINT=ws://localhost:9944 yarn ts-node staking-example.ts
```

## API Reference

### StakingManager Class

Main class for interacting with staking functionality.

**Constructor:**

```typescript
new StakingManager(api: ApiPromise)
```

**Extrinsic Methods:**

- `bond(stash, controller, amount, payee)` - Bond tokens
- `bondExtra(amount)` - Bond additional tokens
- `unbond(amount)` - Unbond tokens
- `rebond(amount)` - Rebond tokens
- `withdrawUnbonded(numSlashingSpans?)` - Withdraw unbonded
- `nominate(targets)` - Nominate validators
- `chill()` - Stop nominating/validating
- `validate(commission, blocked)` - Become validator
- `setController(controller)` - Set controller
- `setPayee(payee)` - Set reward destination
- `payoutStakers(validator, era)` - Claim rewards
- `payoutStakersByPage(validator, era, page)` - Claim rewards by page
- `rebag(account)` - Rebag account
- `putInFrontOf(lighter)` - Reposition in bag
- `bondAndNominate(controller, amount, targets, payee)` - Bond and nominate

**Query Methods:**

- `getStakingInfo(controller)` - Get staking info
- `getStakingParams()` - Get staking parameters
- `getStakingConstants()` - Get all staking constants
- `getValidatorInfo(validator)` - Get validator info
- `getValidators()` - Get all active validators
- `getWaitingValidators()` - Get waiting validators
- `getValidatorPrefs(validator)` - Get validator preferences
- `getNominatorTargets(nominator)` - Get nomination targets
- `getUnbondingInfo(controller)` - Get unbonding info
- `getSlashingSpans(stash)` - Get slashing spans
- `getStakingRewards(era)` - Get era rewards
- `getMinActiveBond()` - Get minimum active bond

**Validation Methods:**

- `canBond(account, amount)` - Check if can bond
- `canUnbond(controller, amount)` - Check if can unbond
- `canNominate(account, targets)` - Check if can nominate
- `canValidate(account, commission)` - Check if can validate

### Utility Functions

```typescript
// Convert JOY to Planck (smallest unit)
joyToBalance(joy: number): bigint

// Convert Planck to JOY
balanceToJoy(balance: Balance | bigint): number
```

## Migration Guide

If you were using the old staking functionality, here's how to migrate:

### Before

```typescript
// Old way (direct API calls)
const bondTx = api.tx.staking.bond(controller, amount, 'Staked')
await bondTx.signAndSend(account)

const nominateTx = api.tx.staking.nominate(targets)
await nominateTx.signAndSend(account)
```

### After

```typescript
// New way (using SDK)
const staking = new StakingManager(api)

// Single transaction for bond and nominate
const tx = staking.bondAndNominate(controller, amount, targets, 'Staked')
await tx.signAndSend(account)

// Or use validation helpers
const { canBond, reason } = await staking.canBond(account, amount)
if (canBond) {
  const tx = staking.bond(controller, controller, amount, 'Staked')
  await tx.signAndSend(account)
}
```

## Contributing

We welcome contributions! Please see the main [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](./LICENSE) file.

## Resources

- [Joystream Documentation](https://joystream.gitbook.io/)
- [Substrate Staking Pallet](https://docs.substrate.io/reference/how-to-guides/pallet-design/implement-staking/)
- [Polkadot.js API](https://polkadot.js.org/docs/api)

## Support

- GitHub Issues: https://github.com/Joystream/joystream/issues
- Discord: https://discord.gg/joystream
