import { ApiPromise } from '@polkadot/api'
import { AccountId, Balance, EraIndex } from '@polkadot/types/interfaces'
import {
  StakingInfo,
  ValidatorInfo,
  StakingParams,
  UnbondingChunk,
} from './types'

/**
 * Convert balance to JOY tokens
 */
export function balanceToJoy(balance: Balance | bigint): number {
  const amount = typeof balance === 'bigint' ? balance : balance.toBigInt()
  return Number(amount) / 10 ** 10 // JOY has 10 decimals
}

/**
 * Convert JOY tokens to balance
 */
export function joyToBalance(joy: number): bigint {
  return BigInt(Math.floor(joy * 10 ** 10))
}

/**
 * Get staking parameters from the chain
 */
export async function getStakingParams(
  api: ApiPromise
): Promise<StakingParams> {
  const [bondingDuration, maxNominations, historyDepth] = await Promise.all([
    api.consts.staking.bondingDuration,
    api.consts.staking.maxNominations,
    api.consts.staking.historyDepth,
  ])

  // Use a default minimum bond if not available in constants
  const minBond = 1n * 10n ** 10n // 1 JOY default

  return {
    minBond,
    bondingDuration: bondingDuration.toNumber(),
    maxNominations: maxNominations.toNumber(),
    historyDepth: historyDepth.toNumber(),
  }
}

/**
 * Parse staking ledger information
 */
export function parseStakingLedger(ledger: any): {
  total: bigint
  active: bigint
  unlocking: UnbondingChunk[]
} {
  if (!ledger) {
    return { total: 0n, active: 0n, unlocking: [] }
  }

  const total = ledger.total?.toBigInt() || 0n
  const active = ledger.active?.toBigInt() || 0n
  const unlocking =
    ledger.unlocking?.map((chunk: any) => ({
      amount: chunk.value.toBigInt(),
      era: chunk.era.toNumber(),
    })) || []

  return { total, active, unlocking }
}

/**
 * Get current era index
 */
export async function getCurrentEra(api: ApiPromise): Promise<number> {
  const currentEra = await api.query.staking.currentEra()
  return currentEra.unwrapOr(api.createType('u32', 0)).toNumber()
}

/**
 * Check if an account is a validator
 */
export async function isValidator(
  api: ApiPromise,
  account: string
): Promise<boolean> {
  const validators = await api.query.session.validators()
  return validators.some(
    (validator: AccountId) => validator.toString() === account
  )
}

/**
 * Get validator commission
 */
export async function getValidatorCommission(
  api: ApiPromise,
  validator: string
): Promise<number> {
  const commission = await api.query.staking.validators(validator)
  return commission.commission.toNumber() / 10 ** 9 // Commission is in parts per billion
}

/**
 * Calculate unbonding period in blocks
 */
export async function getUnbondingPeriodInBlocks(
  api: ApiPromise
): Promise<number> {
  const bondingDuration = await api.consts.staking.bondingDuration
  const sessionsPerEra = await api.consts.staking.sessionsPerEra
  const sessionLength = await api.consts.babe.epochDuration

  return (
    bondingDuration.toNumber() *
    sessionsPerEra.toNumber() *
    sessionLength.toNumber()
  )
}
