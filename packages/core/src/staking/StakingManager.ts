import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { AccountId, Balance, EraIndex } from '@polkadot/types/interfaces'
import {
  StakingInfo,
  ValidatorInfo,
  StakingParams,
  StakingRewards,
  StakingManagerOptions,
} from './types'
import {
  getStakingParams,
  parseStakingLedger,
  getCurrentEra,
  isValidator,
  getValidatorCommission,
  balanceToJoy,
  joyToBalance,
} from './utils'

export class StakingManager {
  constructor(private api: ApiPromise) {}

  /**
   * Get staking information for an account
   */
  async getStakingInfo(controller: string): Promise<StakingInfo | null> {
    try {
      const [ledger, nominations, payee, currentEra] = await Promise.all([
        this.api.query.staking.ledger(controller),
        this.api.query.staking.nominators(controller),
        this.api.query.staking.payee(controller),
        getCurrentEra(this.api),
      ])

      if (!ledger.isSome) {
        return null
      }

      const ledgerData = ledger.unwrap()
      const { total, active, unlocking } = parseStakingLedger(ledgerData)

      // Calculate withdrawable amount
      const withdrawable = unlocking
        .filter((chunk) => chunk.era <= currentEra)
        .reduce((sum, chunk) => sum + chunk.amount, 0n)

      const unbonding = unlocking
        .filter((chunk) => chunk.era > currentEra)
        .reduce((sum, chunk) => sum + chunk.amount, 0n)

      return {
        controller,
        stash: ledgerData.stash.toString(),
        bonded: active,
        unbonding,
        withdrawable,
        nominations: nominations.isSome
          ? nominations.unwrap().targets.map((t: AccountId) => t.toString())
          : [],
        payee: payee.isAccount ? payee.asAccount.toString() : 'Staked',
        chilled: false, // TODO: Check if account is chilled
      }
    } catch (error) {
      console.error('Error getting staking info:', error)
      return null
    }
  }

  /**
   * Get validator information
   */
  async getValidatorInfo(validator: string): Promise<ValidatorInfo | null> {
    try {
      const [commission, eraPoints, validators] = await Promise.all([
        getValidatorCommission(this.api, validator),
        this.api.query.staking.erasRewardPoints.entries(),
        this.api.query.session.validators(),
      ])

      const isActive = validators.some(
        (v: AccountId) => v.toString() === validator
      )

      // Get current era exposure
      const currentEra = await getCurrentEra(this.api)
      const currentExposure = await this.api.query.staking.erasStakers(
        currentEra,
        validator
      )

      let totalStake = 0n
      let ownStake = 0n
      let nominatorCount = 0

      if (currentExposure) {
        totalStake = currentExposure.total.toBigInt()
        ownStake = currentExposure.own.toBigInt()
        nominatorCount = currentExposure.others.length
      }

      // Get era points
      const currentEraPoints =
        await this.api.query.staking.erasRewardPoints(currentEra)
      const validatorAccountId = this.api.createType('AccountId32', validator)
      const points =
        currentEraPoints.individual.get(validatorAccountId)?.toNumber() || 0

      return {
        account: validator,
        commission: commission / 100, // Convert to percentage
        totalStake,
        ownStake,
        nominatorCount,
        eraPoints: points,
        isActive,
      }
    } catch (error) {
      console.error('Error getting validator info:', error)
      return null
    }
  }

  /**
   * Get list of active validators
   */
  async getValidators(): Promise<ValidatorInfo[]> {
    try {
      const validators = await this.api.query.session.validators()
      const validatorInfos = await Promise.all(
        validators.map((validator: AccountId) =>
          this.getValidatorInfo(validator.toString())
        )
      )

      return validatorInfos.filter(
        (info): info is ValidatorInfo => info !== null
      )
    } catch (error) {
      console.error('Error getting validators:', error)
      return []
    }
  }

  /**
   * Get staking parameters
   */
  async getStakingParams(): Promise<StakingParams> {
    return getStakingParams(this.api)
  }

  /**
   * Create bond extrinsic
   */
  bond(
    stash: string,
    controller: string,
    amount: bigint,
    payee: 'Staked' | 'Stash' | 'Controller' | string = 'Staked'
  ): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.bond(controller, amount, payee)
  }

  /**
   * Create bond extra extrinsic
   */
  bondExtra(amount: bigint): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.bondExtra(amount)
  }

  /**
   * Create unbond extrinsic
   */
  unbond(amount: bigint): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.unbond(amount)
  }

  /**
   * Create withdraw unbonded extrinsic
   */
  withdrawUnbonded(numSlashingSpans?: number): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.withdrawUnbonded(numSlashingSpans || 0)
  }

  /**
   * Create nominate extrinsic
   */
  nominate(targets: string[]): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.nominate(targets)
  }

  /**
   * Create chill extrinsic
   */
  chill(): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.chill()
  }

  /**
   * Create set payee extrinsic
   */
  setPayee(
    payee: 'Staked' | 'Stash' | 'Controller' | string
  ): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.setPayee(payee)
  }

  /**
   * Create payout stakers extrinsic
   */
  payoutStakers(
    validator: string,
    era: number
  ): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.payoutStakers(validator, era)
  }

  /**
   * Get staking rewards for an era
   */
  async getStakingRewards(era: number): Promise<StakingRewards | null> {
    try {
      const [totalRewards, validatorRewards] = await Promise.all([
        this.api.query.staking.erasValidatorReward(era),
        this.api.query.staking.erasRewardPoints(era),
      ])

      if (!totalRewards.isSome) {
        return null
      }

      const total = totalRewards.unwrap().toBigInt()
      const points = validatorRewards.total.toNumber()
      const validatorPoints = validatorRewards.individual.size

      return {
        era,
        totalRewards: total,
        validatorRewards: (total * BigInt(validatorPoints)) / BigInt(points),
        nominatorRewards:
          total - (total * BigInt(validatorPoints)) / BigInt(points),
      }
    } catch (error) {
      console.error('Error getting staking rewards:', error)
      return null
    }
  }

  /**
   * Get unbonding information for an account
   */
  async getUnbondingInfo(
    controller: string
  ): Promise<{ amount: bigint; eras: number[] }> {
    try {
      const ledger = await this.api.query.staking.ledger(controller)

      if (!ledger.isSome) {
        return { amount: 0n, eras: [] }
      }

      const { unlocking } = parseStakingLedger(ledger.unwrap())
      const currentEra = await getCurrentEra(this.api)

      const unbondingAmount = unlocking
        .filter((chunk) => chunk.era > currentEra)
        .reduce((sum, chunk) => sum + chunk.amount, 0n)

      const unbondingEras = unlocking
        .filter((chunk) => chunk.era > currentEra)
        .map((chunk) => chunk.era)

      return {
        amount: unbondingAmount,
        eras: [...new Set(unbondingEras)],
      }
    } catch (error) {
      console.error('Error getting unbonding info:', error)
      return { amount: 0n, eras: [] }
    }
  }

  /**
   * Check if account can bond
   */
  async canBond(
    account: string,
    amount: bigint
  ): Promise<{ canBond: boolean; reason?: string }> {
    try {
      const params = await this.getStakingParams()

      if (amount < params.minBond) {
        return {
          canBond: false,
          reason: `Amount ${balanceToJoy(amount)} JOY is below minimum bond of ${balanceToJoy(params.minBond)} JOY`,
        }
      }

      const balance = await this.api.derive.balances.all(account)
      if (balance.availableBalance.toBigInt() < amount) {
        return {
          canBond: false,
          reason: `Insufficient balance. Available: ${balanceToJoy(balance.availableBalance.toBigInt())} JOY`,
        }
      }

      return { canBond: true }
    } catch (error) {
      return {
        canBond: false,
        reason: `Error checking bond eligibility: ${error}`,
      }
    }
  }

  /**
   * Check if account can unbond
   */
  async canUnbond(
    controller: string,
    amount: bigint
  ): Promise<{ canUnbond: boolean; reason?: string }> {
    try {
      const stakingInfo = await this.getStakingInfo(controller)

      if (!stakingInfo) {
        return {
          canUnbond: false,
          reason: 'No staking information found for this account',
        }
      }

      if (amount > stakingInfo.bonded) {
        return {
          canUnbond: false,
          reason: `Cannot unbond ${balanceToJoy(amount)} JOY. Only ${balanceToJoy(stakingInfo.bonded)} JOY is bonded`,
        }
      }

      return { canUnbond: true }
    } catch (error) {
      return {
        canUnbond: false,
        reason: `Error checking unbond eligibility: ${error}`,
      }
    }
  }
}
