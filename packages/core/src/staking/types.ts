import {
  AccountId,
  Balance,
  EraIndex,
  StakingLedger,
} from '@polkadot/types/interfaces'
import { ApiPromise } from '@polkadot/api'

export interface StakingInfo {
  /** Controller account */
  controller: string
  /** Stash account */
  stash: string
  /** Total bonded amount */
  bonded: bigint
  /** Total unbonding amount */
  unbonding: bigint
  /** Available for withdrawal */
  withdrawable: bigint
  /** Current nominations */
  nominations: string[]
  /** Reward destination */
  payee: string
  /** Whether account is chilled */
  chilled: boolean
}

export interface ValidatorInfo {
  /** Validator account */
  account: string
  /** Commission rate (0-1) */
  commission: number
  /** Total stake */
  totalStake: bigint
  /** Own stake */
  ownStake: bigint
  /** Number of nominators */
  nominatorCount: number
  /** Era points */
  eraPoints: number
  /** Whether validator is active */
  isActive: boolean
}

export interface UnbondingChunk {
  /** Amount being unbonded */
  amount: bigint
  /** Era when unbonding completes */
  era: number
}

export interface StakingLedgerInfo {
  /** Total bonded amount */
  total: bigint
  /** Active bonded amount */
  active: bigint
  /** Unbonding chunks */
  unlocking: UnbondingChunk[]
}

export interface StakingParams {
  /** Minimum bond amount */
  minBond: bigint
  /** Bonding duration in eras */
  bondingDuration: number
  /** Maximum number of nominations */
  maxNominations: number
  /** History depth */
  historyDepth: number
}

export interface StakingRewards {
  /** Era index */
  era: number
  /** Total rewards for the era */
  totalRewards: bigint
  /** Validator rewards */
  validatorRewards: bigint
  /** Nominator rewards */
  nominatorRewards: bigint
}

export interface ValidatorPrefs {
  /** Commission rate (0-100) */
  commission: number
  /** Whether validator is blocked from nomination */
  blocked?: boolean
}

export interface SlashingSpans {
  /** Last non-zero slash era */
  lastNonzeroSlash: number
  /** Prior slashing eras */
  prior: number[]
  /** Span index */
  spanIndex: number
}

export interface WaitingValidator {
  /** Validator account */
  account: string
  /** Commission rate */
  commission: number
  /** Total stake */
  totalStake: bigint
  /** Own stake */
  ownStake: bigint
}

export interface NominatorTarget {
  /** Target validator address */
  validator: string
  /** Nominator's stake with this validator */
  stake: bigint
  /** Whether validator is active */
  isActive: boolean
}

export interface MinActiveBondInfo {
  /** Minimum bond amount to be in active set */
  minBond: bigint
  /** Number of active nominators */
  activeNominators: number
  /** Maximum nominators allowed */
  maxNominators: number
}

export type StakingExtrinsic =
  | 'bond'
  | 'bondExtra'
  | 'unbond'
  | 'rebond'
  | 'withdrawUnbonded'
  | 'nominate'
  | 'chill'
  | 'validate'
  | 'setPayee'
  | 'setController'
  | 'payoutStakers'
  | 'payoutStakersByPage'
  | 'rebag'
  | 'putInFrontOf'

export interface StakingManagerOptions {
  /** API instance */
  api: ApiPromise
}
