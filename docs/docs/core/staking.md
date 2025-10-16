---
sidebar_position: 6
---

import { GhLink } from '@site/src/components/GhLink';
import CodeBlock from '@theme/CodeBlock';

# Staking module

The staking module of Joystream SDK provides comprehensive functionality for staking operations, including bonding, unbonding, nominating validators, and managing staking rewards.

## Key features

- **Bonding and Unbonding**: Bond tokens to participate in staking and unbond them when needed
- **Validator Management**: Get information about active validators and their performance
- **Nomination**: Nominate validators to earn staking rewards
- **Reward Management**: Track and claim staking rewards
- **Cost Estimation**: Calculate costs for staking operations
- **Comprehensive Queries**: Get detailed staking information and statistics

## StakingManager class

`StakingManager` is the main class provided by the staking module.

### Initializing

#### Standalone

```typescript
import { createApi } from '@joystream/sdk-core/chain'
import { StakingManager } from '@joystream/sdk-core/staking'

const api = await createApi(`wss://mainnet.joystream.dev/rpc`)
const staking = new StakingManager(api)
```

#### via JoystreamToolbox

```typescript
import { createJoystreamToolbox } from '@joystream/sdk-core/toolbox'

const joystreamToolbox = await createJoystreamToolbox({
  nodeWsEndpoint: 'wss://mainnet.joystream.dev/rpc',
  // ...
})
const { staking } = joystreamToolbox
```

## Staking Operations

### Bonding Tokens

Bonding is the process of locking tokens to participate in the staking system.

```typescript
// Check if account can bond
const bondAmount = 100n * 10n ** 10n // 100 JOY in HAPI
const canBond = await staking.canBond(account, bondAmount)

if (canBond.canBond) {
  // Create bond transaction
  const bondTx = staking.bond(stash, controller, bondAmount, 'Staked')

  // Execute transaction
  await tx.run(bondTx, account).finalized()
  console.log('Successfully bonded tokens')
} else {
  console.log(`Cannot bond: ${canBond.reason}`)
}
```

### Unbonding Tokens

Unbonding starts the process of unlocking bonded tokens.

```typescript
// Check if account can unbond
const unbondAmount = 50n * 10n ** 10n // 50 JOY in HAPI
const canUnbond = await staking.canUnbond(controller, unbondAmount)

if (canUnbond.canUnbond) {
  // Create unbond transaction
  const unbondTx = staking.unbond(unbondAmount)

  // Execute transaction
  await tx.run(unbondTx, controller).finalized()
  console.log('Successfully unbonded tokens')
}
```

### Nominating Validators

Nominating allows you to choose validators to earn staking rewards.

```typescript
// Get active validators
const validators = await staking.getValidators()

// Select validators to nominate (up to maxNominations)
const nominees = validators.slice(0, 3).map((v) => v.account)

// Create nominate transaction
const nominateTx = staking.nominate(nominees)

// Execute transaction
await tx.run(nominateTx, controller).finalized()
console.log('Successfully nominated validators')
```

### Withdrawing Unbonded Funds

After the unbonding period, you can withdraw your unbonded funds.

```typescript
// Create withdraw unbonded transaction
const withdrawTx = staking.withdrawUnbonded()

// Execute transaction
await tx.run(withdrawTx, controller).finalized()
console.log('Successfully withdrew unbonded funds')
```

## Querying Staking Information

### Get Staking Information

```typescript
const stakingInfo = await staking.getStakingInfo(controller)

if (stakingInfo) {
  console.log(`Controller: ${stakingInfo.controller}`)
  console.log(`Stash: ${stakingInfo.stash}`)
  console.log(`Bonded: ${stakingInfo.bonded} HAPI`)
  console.log(`Unbonding: ${stakingInfo.unbonding} HAPI`)
  console.log(`Withdrawable: ${stakingInfo.withdrawable} HAPI`)
  console.log(`Nominations: ${stakingInfo.nominations.length}`)
  console.log(`Payee: ${stakingInfo.payee}`)
}
```

### Get Validator Information

```typescript
const validatorInfo = await staking.getValidatorInfo(validatorAddress)

if (validatorInfo) {
  console.log(`Account: ${validatorInfo.account}`)
  console.log(`Commission: ${validatorInfo.commission}%`)
  console.log(`Total Stake: ${validatorInfo.totalStake} HAPI`)
  console.log(`Own Stake: ${validatorInfo.ownStake} HAPI`)
  console.log(`Nominator Count: ${validatorInfo.nominatorCount}`)
  console.log(`Era Points: ${validatorInfo.eraPoints}`)
  console.log(`Is Active: ${validatorInfo.isActive}`)
}
```

### Get Active Validators

```typescript
const validators = await staking.getValidators()

console.log(`Found ${validators.length} active validators:`)
validators.forEach((validator, i) => {
  console.log(`${i + 1}. ${validator.account}`)
  console.log(`   Commission: ${validator.commission.toFixed(2)}%`)
  console.log(`   Total stake: ${validator.totalStake} HAPI`)
  console.log(`   Nominators: ${validator.nominatorCount}`)
})
```

### Get Staking Parameters

```typescript
const params = await staking.getStakingParams()

console.log(`Minimum bond: ${params.minBond} HAPI`)
console.log(`Bonding duration: ${params.bondingDuration} eras`)
console.log(`Max nominations: ${params.maxNominations}`)
console.log(`History depth: ${params.historyDepth}`)
```

### Get Unbonding Information

```typescript
const unbondingInfo = await staking.getUnbondingInfo(controller)

console.log(`Unbonding amount: ${unbondingInfo.amount} HAPI`)
console.log(`Unbonding eras: ${unbondingInfo.eras.join(', ')}`)
```

### Get Staking Rewards

```typescript
const currentEra = await api.query.staking.currentEra()
const rewards = await staking.getStakingRewards(currentEra.toNumber())

if (rewards) {
  console.log(`Era: ${rewards.era}`)
  console.log(`Total rewards: ${rewards.totalRewards} HAPI`)
  console.log(`Validator rewards: ${rewards.validatorRewards} HAPI`)
  console.log(`Nominator rewards: ${rewards.nominatorRewards} HAPI`)
}
```

## Cost Estimation

The staking module integrates with the assets module to provide cost estimation for staking operations.

```typescript
import { AssetsManager } from '@joystream/sdk-core/assets'

const assets = new AssetsManager(api)

// Estimate costs for bonding
const bondTx = staking.bond(stash, controller, bondAmount, 'Staked')
const costs = await assets.costsOf(bondTx, account)
const requiredBalances = assets.requiredBalances(costs)

console.log(`Required balances for bonding:`)
console.log(`  Transferrable: ${requiredBalances.transferrable} HAPI`)
console.log(`  Fee usable: ${requiredBalances.feeUsable} HAPI`)
```

## Available Extrinsics

The staking module provides the following extrinsics:

| Extrinsic          | Description                               | Parameters                               |
| ------------------ | ----------------------------------------- | ---------------------------------------- |
| `bond`             | Bond tokens to participate in staking     | `stash`, `controller`, `amount`, `payee` |
| `bondExtra`        | Bond additional tokens                    | `amount`                                 |
| `unbond`           | Start unbonding process                   | `amount`                                 |
| `withdrawUnbonded` | Withdraw unbonded funds                   | `numSlashingSpans?`                      |
| `nominate`         | Nominate validators                       | `targets`                                |
| `chill`            | Stop participating as validator/nominator | -                                        |
| `setPayee`         | Set reward destination                    | `payee`                                  |
| `payoutStakers`    | Payout staking rewards                    | `validator`, `era`                       |

## Available Queries

The staking module provides the following queries:

| Query               | Description                            | Returns           |
| ------------------- | -------------------------------------- | ----------------- |
| `getStakingInfo`    | Get staking information for an account | `StakingInfo`     |
| `getValidatorInfo`  | Get validator information              | `ValidatorInfo`   |
| `getValidators`     | Get list of active validators          | `ValidatorInfo[]` |
| `getStakingParams`  | Get staking parameters                 | `StakingParams`   |
| `getUnbondingInfo`  | Get unbonding information              | `UnbondingInfo`   |
| `getStakingRewards` | Get staking rewards for an era         | `StakingRewards`  |
| `canBond`           | Check if account can bond              | `CanBondResult`   |
| `canUnbond`         | Check if account can unbond            | `CanUnbondResult` |

## Types

### StakingInfo

```typescript
interface StakingInfo {
  controller: string
  stash: string
  bonded: bigint
  unbonding: bigint
  withdrawable: bigint
  nominations: string[]
  payee: string
  chilled: boolean
}
```

### ValidatorInfo

```typescript
interface ValidatorInfo {
  account: string
  commission: number
  totalStake: bigint
  ownStake: bigint
  nominatorCount: number
  eraPoints: number
  isActive: boolean
}
```

### StakingParams

```typescript
interface StakingParams {
  minBond: bigint
  bondingDuration: number
  maxNominations: number
  historyDepth: number
}
```

## Example Usage

See the complete staking example in the [examples directory](https://github.com/Joystream/sdk/tree/main/examples/staking).

<GhLink path="examples/staking/ts/main.ts" />
