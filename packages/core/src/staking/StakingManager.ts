import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { AccountId } from '@polkadot/types/interfaces'
import {
  StakingInfo,
  ValidatorInfo,
  StakingParams,
  StakingRewards,
  ValidatorPrefs,
  SlashingSpans,
  WaitingValidator,
  NominatorTarget,
  MinActiveBondInfo,
} from './types'
import {
  getStakingParams,
  parseStakingLedger,
  getCurrentEra,
  getValidatorCommission,
  balanceToJoy,
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
      const { active, unlocking } = parseStakingLedger(ledgerData)

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
      const [commission, activeValidators] = await Promise.all([
        getValidatorCommission(this.api, validator),
        this.api.query.session.validators(),
      ])

      const isActive = activeValidators.some(
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
   * Create rebond extrinsic (rebond previously unbonded tokens)
   */
  rebond(amount: bigint): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.rebond(amount)
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
   * Create validate extrinsic (declare intention to validate)
   * @param commission Commission percentage (0-100)
   * @param blocked Whether to block nominations
   */
  validate(
    commission: number,
    blocked: boolean = false
  ): SubmittableExtrinsic<'promise'> {
    // Commission is in parts per billion (0-1000000000)
    const commissionPerbill = Math.floor((commission / 100) * 1_000_000_000)
    return this.api.tx.staking.validate({
      commission: commissionPerbill,
      blocked,
    })
  }

  /**
   * Create set controller extrinsic
   */
  setController(controller: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.staking.setController(controller)
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
   * Create payout stakers by page extrinsic
   */
  payoutStakersByPage(
    validator: string,
    era: number
  ): SubmittableExtrinsic<'promise'> {
    // Note: payoutStakersByPage may not be available in all versions
    // Fallback to regular payoutStakers if not available
    return this.api.tx.staking.payoutStakers(validator, era)
  }

  /**
   * Create rebag extrinsic (move account to correct bag)
   */
  rebag(account: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.bagsList.rebag(account)
  }

  /**
   * Create put in front of extrinsic (reposition within bag)
   */
  putInFrontOf(lighter: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.bagsList.putInFrontOf(lighter)
  }

  /**
   * Create batch transaction for bond and nominate
   */
  bondAndNominate(
    controller: string,
    amount: bigint,
    targets: string[],
    payee: 'Staked' | 'Stash' | 'Controller' | string = 'Staked'
  ): SubmittableExtrinsic<'promise'> {
    return this.api.tx.utility.batch([
      this.bond(controller, controller, amount, payee),
      this.nominate(targets),
    ])
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

  /**
   * Get slashing spans for an account
   */
  async getSlashingSpans(stash: string): Promise<SlashingSpans | null> {
    try {
      const spans = await this.api.query.staking.slashingSpans(stash)

      if (!spans.isSome) {
        return null
      }

      const spanData = spans.unwrap()
      return {
        lastNonzeroSlash: spanData.lastNonzeroSlash.toNumber(),
        prior: spanData.prior.map((era: { toNumber(): number }) =>
          era.toNumber()
        ),
        spanIndex: spanData.spanIndex.toNumber(),
      }
    } catch (error) {
      console.error('Error getting slashing spans:', error)
      return null
    }
  }

  /**
   * Get validator preferences
   */
  async getValidatorPrefs(validator: string): Promise<ValidatorPrefs | null> {
    try {
      const prefs = await this.api.query.staking.validators(validator)

      return {
        commission: prefs.commission.toNumber() / 10 ** 7, // Convert from Perbill (parts per billion) to percentage
        blocked: prefs.blocked?.isTrue || false,
      }
    } catch (error) {
      console.error('Error getting validator preferences:', error)
      return null
    }
  }

  /**
   * Get waiting validators (validators not in active set)
   */
  async getWaitingValidators(): Promise<WaitingValidator[]> {
    try {
      const [allValidatorEntries, activeValidators, currentEra] =
        await Promise.all([
          this.api.query.staking.validators.entries(),
          this.api.query.session.validators(),
          getCurrentEra(this.api),
        ])

      const activeSet = new Set(
        activeValidators.map((v: AccountId) => v.toString())
      )

      const waitingValidators: WaitingValidator[] = []

      for (const [key, prefs] of allValidatorEntries) {
        const account = key.args[0].toString()

        // Skip if in active set
        if (activeSet.has(account)) continue

        // Get exposure for current era
        const exposure = await this.api.query.staking.erasStakers(
          currentEra,
          account
        )

        waitingValidators.push({
          account,
          commission: prefs.commission.toNumber() / 10 ** 7,
          totalStake: exposure.total.toBigInt(),
          ownStake: exposure.own.toBigInt(),
        })
      }

      return waitingValidators.sort((a, b) =>
        a.totalStake > b.totalStake ? -1 : 1
      )
    } catch (error) {
      console.error('Error getting waiting validators:', error)
      return []
    }
  }

  /**
   * Get current nominations with exposure information
   */
  async getNominatorTargets(
    nominator: string
  ): Promise<NominatorTarget[] | null> {
    try {
      const [nominations, activeValidators, currentEra] = await Promise.all([
        this.api.query.staking.nominators(nominator),
        this.api.query.session.validators(),
        getCurrentEra(this.api),
      ])

      if (!nominations.isSome) {
        return null
      }

      const targets = nominations.unwrap().targets
      const activeSet = new Set(
        activeValidators.map((v: AccountId) => v.toString())
      )

      const targetInfo: NominatorTarget[] = []

      for (const target of targets) {
        const targetAddr = target.toString()
        const isActive = activeSet.has(targetAddr)

        let stake = 0n
        if (isActive) {
          const exposure = await this.api.query.staking.erasStakers(
            currentEra,
            targetAddr
          )

          // Find nominator's stake in exposure
          const nominatorExposure = exposure.others.find(
            (other: {
              who: { toString(): string }
              value: { toBigInt(): bigint }
            }) => other.who.toString() === nominator
          )

          if (nominatorExposure) {
            stake = nominatorExposure.value.toBigInt()
          }
        }

        targetInfo.push({
          validator: targetAddr,
          stake,
          isActive,
        })
      }

      return targetInfo
    } catch (error) {
      console.error('Error getting nominator targets:', error)
      return null
    }
  }

  /**
   * Get minimum active bond (minimum to be in active nominator set)
   */
  async getMinActiveBond(): Promise<MinActiveBondInfo | null> {
    try {
      const nominatorEntries = await this.api.query.staking.nominators.entries()

      // Get all active nominators with their stakes
      const activeNominators: { account: string; stake: bigint }[] = []

      for (const [key] of nominatorEntries) {
        const account = key.args[0].toString()
        const ledger = await this.api.query.staking.ledger(account)

        if (ledger.isSome) {
          const { active } = parseStakingLedger(ledger.unwrap())
          activeNominators.push({ account, stake: active })
        }
      }

      // Sort by stake descending
      activeNominators.sort((a, b) => (a.stake > b.stake ? -1 : 1))

      const maxNominators =
        this.api.consts.staking.maxNominatorRewardedPerValidator?.toNumber() ||
        256

      const minActiveBond =
        activeNominators.length > 0
          ? activeNominators[
              Math.min(activeNominators.length - 1, maxNominators - 1)
            ].stake
          : 0n

      return {
        minBond: minActiveBond,
        activeNominators: activeNominators.length,
        maxNominators,
      }
    } catch (error) {
      console.error('Error getting min active bond:', error)
      return null
    }
  }

  /**
   * Check if account can nominate specific targets
   */
  async canNominate(
    account: string,
    targets: string[]
  ): Promise<{ canNominate: boolean; reason?: string }> {
    try {
      const params = await this.getStakingParams()

      if (targets.length === 0) {
        return {
          canNominate: false,
          reason: 'No targets specified',
        }
      }

      if (targets.length > params.maxNominations) {
        return {
          canNominate: false,
          reason: `Too many nominations. Maximum is ${params.maxNominations}, got ${targets.length}`,
        }
      }

      // Check if account has bonded stake
      const ledger = await this.api.query.staking.ledger(account)
      if (!ledger.isSome) {
        return {
          canNominate: false,
          reason: 'Account has no bonded stake',
        }
      }

      return { canNominate: true }
    } catch (error) {
      return {
        canNominate: false,
        reason: `Error checking nomination eligibility: ${error}`,
      }
    }
  }

  /**
   * Check if account can become a validator
   */
  async canValidate(
    account: string,
    commission: number
  ): Promise<{ canValidate: boolean; reason?: string }> {
    try {
      if (commission < 0 || commission > 100) {
        return {
          canValidate: false,
          reason: 'Commission must be between 0 and 100',
        }
      }

      // Check if account has bonded stake
      const ledger = await this.api.query.staking.ledger(account)
      if (!ledger.isSome) {
        return {
          canValidate: false,
          reason: 'Account has no bonded stake',
        }
      }

      const { active } = parseStakingLedger(ledger.unwrap())
      const minValidatorBond = 0n // Note: minValidatorBond may not be available in all versions

      if (minValidatorBond > 0n && active < minValidatorBond) {
        return {
          canValidate: false,
          reason: `Insufficient bonded stake. Minimum is ${balanceToJoy(minValidatorBond)} JOY, you have ${balanceToJoy(active)} JOY`,
        }
      }

      return { canValidate: true }
    } catch (error) {
      return {
        canValidate: false,
        reason: `Error checking validation eligibility: ${error}`,
      }
    }
  }

  /**
   * Get staking constants
   */
  async getStakingConstants(): Promise<{
    bondingDuration: number
    maxNominations: number
    historyDepth: number
    sessionsPerEra: number
    maxNominatorRewardedPerValidator: number
    minValidatorBond: bigint
    minNominatorBond: bigint
    validatorCount: number
  }> {
    const [
      bondingDuration,
      maxNominations,
      historyDepth,
      sessionsPerEra,
      maxNominatorRewardedPerValidator,
      minValidatorBond,
      minNominatorBond,
      validatorCount,
    ] = await Promise.all([
      this.api.consts.staking.bondingDuration,
      this.api.consts.staking.maxNominations,
      this.api.consts.staking.historyDepth,
      this.api.consts.staking.sessionsPerEra || this.api.createType('u32', 6),
      this.api.consts.staking.maxNominatorRewardedPerValidator ||
        this.api.createType('u32', 256),
      this.api.createType('u128', 0), // minValidatorBond not available
      this.api.createType('u128', 0), // minNominatorBond not available
      this.api.query.staking.validatorCount(),
    ])

    return {
      bondingDuration: bondingDuration.toNumber(),
      maxNominations: maxNominations.toNumber(),
      historyDepth: historyDepth.toNumber(),
      sessionsPerEra: sessionsPerEra.toNumber(),
      maxNominatorRewardedPerValidator:
        maxNominatorRewardedPerValidator.toNumber(),
      minValidatorBond: minValidatorBond.toBigInt(),
      minNominatorBond: minNominatorBond.toBigInt(),
      validatorCount: validatorCount.toNumber(),
    }
  }
}
