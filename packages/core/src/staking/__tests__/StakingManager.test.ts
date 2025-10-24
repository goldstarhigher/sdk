import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { StakingManager, balanceToJoy, joyToBalance } from '../index'

const TEST_NODE_ENDPOINT =
  process.env.TEST_NODE_ENDPOINT || 'ws://localhost:9944'

jest.setTimeout(30_000)

describe('StakingManager', () => {
  let api: ApiPromise
  let staking: StakingManager

  beforeAll(async () => {
    const provider = new WsProvider(TEST_NODE_ENDPOINT)
    api = await ApiPromise.create({ provider })
    staking = new StakingManager(api)
  })

  afterAll(async () => {
    await api.disconnect()
  })

  describe('Utility Functions', () => {
    test('should convert JOY to balance correctly', () => {
      expect(joyToBalance(1)).toBe(10_000_000_000n)
      expect(joyToBalance(0.1)).toBe(1_000_000_000n)
      expect(joyToBalance(100)).toBe(1_000_000_000_000n)
    })

    test('should convert balance to JOY correctly', () => {
      expect(balanceToJoy(10_000_000_000n)).toBe(1)
      expect(balanceToJoy(1_000_000_000n)).toBe(0.1)
      expect(balanceToJoy(1_000_000_000_000n)).toBe(100)
    })
  })

  describe('Staking Parameters', () => {
    test('should get staking params', async () => {
      const params = await staking.getStakingParams()

      expect(params).toBeDefined()
      expect(params.minBond).toBeGreaterThan(0n)
      expect(params.bondingDuration).toBeGreaterThan(0)
      expect(params.maxNominations).toBeGreaterThan(0)
      expect(params.historyDepth).toBeGreaterThan(0)
    })

    test('should get staking constants', async () => {
      const constants = await staking.getStakingConstants()

      expect(constants).toBeDefined()
      expect(constants.bondingDuration).toBeGreaterThan(0)
      expect(constants.maxNominations).toBeGreaterThan(0)
      expect(constants.historyDepth).toBeGreaterThan(0)
      expect(constants.sessionsPerEra).toBeGreaterThan(0)
      expect(constants.maxNominatorRewardedPerValidator).toBeGreaterThan(0)
      expect(constants.validatorCount).toBeGreaterThan(0)
    })
  })

  describe('Validator Queries', () => {
    test('should get active validators', async () => {
      const validators = await staking.getValidators()

      expect(Array.isArray(validators)).toBe(true)

      if (validators.length > 0) {
        const validator = validators[0]
        expect(validator.account).toBeDefined()
        expect(typeof validator.commission).toBe('number')
        expect(typeof validator.totalStake).toBe('bigint')
        expect(typeof validator.ownStake).toBe('bigint')
        expect(typeof validator.nominatorCount).toBe('number')
        expect(typeof validator.eraPoints).toBe('number')
        expect(typeof validator.isActive).toBe('boolean')
      }
    })

    test('should get waiting validators', async () => {
      const waiting = await staking.getWaitingValidators()

      expect(Array.isArray(waiting)).toBe(true)

      if (waiting.length > 0) {
        const validator = waiting[0]
        expect(validator.account).toBeDefined()
        expect(typeof validator.commission).toBe('number')
        expect(typeof validator.totalStake).toBe('bigint')
        expect(typeof validator.ownStake).toBe('bigint')
      }
    })

    test('should get validator info for active validator', async () => {
      const validators = await staking.getValidators()

      if (validators.length > 0) {
        const validatorAddress = validators[0].account
        const info = await staking.getValidatorInfo(validatorAddress)

        expect(info).toBeDefined()
        if (info) {
          expect(info.account).toBe(validatorAddress)
          expect(typeof info.commission).toBe('number')
          expect(info.isActive).toBe(true)
        }
      }
    })

    test('should get validator preferences', async () => {
      const validators = await staking.getValidators()

      if (validators.length > 0) {
        const validatorAddress = validators[0].account
        const prefs = await staking.getValidatorPrefs(validatorAddress)

        expect(prefs).toBeDefined()
        if (prefs) {
          expect(typeof prefs.commission).toBe('number')
          expect(prefs.commission).toBeGreaterThanOrEqual(0)
          expect(prefs.commission).toBeLessThanOrEqual(100)
        }
      }
    })
  })

  describe('Extrinsic Creation', () => {
    test('should create bond extrinsic', () => {
      const tx = staking.bond('stash', 'controller', 1000n, 'Staked')

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('bond')
    })

    test('should create bondExtra extrinsic', () => {
      const tx = staking.bondExtra(1000n)

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('bondExtra')
    })

    test('should create unbond extrinsic', () => {
      const tx = staking.unbond(1000n)

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('unbond')
    })

    test('should create rebond extrinsic', () => {
      const tx = staking.rebond(1000n)

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('rebond')
    })

    test('should create withdrawUnbonded extrinsic', () => {
      const tx = staking.withdrawUnbonded()

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('withdrawUnbonded')
    })

    test('should create nominate extrinsic', () => {
      const tx = staking.nominate(['validator1', 'validator2'])

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('nominate')
    })

    test('should create chill extrinsic', () => {
      const tx = staking.chill()

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('chill')
    })

    test('should create validate extrinsic', () => {
      const tx = staking.validate(10, false)

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('validate')
    })

    test('should create setController extrinsic', () => {
      const tx = staking.setController('newController')

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('setController')
    })

    test('should create setPayee extrinsic', () => {
      const tx = staking.setPayee('Staked')

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('setPayee')
    })

    test('should create payoutStakers extrinsic', () => {
      const tx = staking.payoutStakers('validator', 100)

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('payoutStakers')
    })

    test('should create payoutStakersByPage extrinsic', () => {
      const tx = staking.payoutStakersByPage('validator', 100, 0)

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('staking')
      expect(tx.method.method).toBe('payoutStakersByPage')
    })

    test('should create rebag extrinsic', () => {
      const tx = staking.rebag('account')

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('bagsList')
      expect(tx.method.method).toBe('rebag')
    })

    test('should create putInFrontOf extrinsic', () => {
      const tx = staking.putInFrontOf('lighter')

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('bagsList')
      expect(tx.method.method).toBe('putInFrontOf')
    })

    test('should create bondAndNominate batch extrinsic', () => {
      const tx = staking.bondAndNominate(
        'controller',
        1000n,
        ['validator1'],
        'Staked'
      )

      expect(tx).toBeDefined()
      expect(tx.method.section).toBe('utility')
      expect(tx.method.method).toBe('batch')
    })
  })

  describe('Validation Helpers', () => {
    test('should validate bond amount against minimum', async () => {
      const params = await staking.getStakingParams()

      // Amount below minimum
      const result1 = await staking.canBond('account', params.minBond - 1n)
      expect(result1.canBond).toBe(false)
      expect(result1.reason).toBeDefined()

      // Amount at minimum (this might fail due to insufficient balance)
      const result2 = await staking.canBond('account', params.minBond)
      // We don't check canBond here as it depends on account balance
      expect(result2).toBeDefined()
    })

    test('should validate nomination targets count', async () => {
      const params = await staking.getStakingParams()

      // Too many targets
      const tooManyTargets = Array(params.maxNominations + 1).fill('validator')
      const result = await staking.canNominate('account', tooManyTargets)

      expect(result.canNominate).toBe(false)
      expect(result.reason).toContain('Too many nominations')
    })

    test('should validate empty nomination targets', async () => {
      const result = await staking.canNominate('account', [])

      expect(result.canNominate).toBe(false)
      expect(result.reason).toContain('No targets specified')
    })

    test('should validate commission range', async () => {
      // Invalid commission (negative)
      const result1 = await staking.canValidate('account', -1)
      expect(result1.canValidate).toBe(false)
      expect(result1.reason).toContain('Commission must be between 0 and 100')

      // Invalid commission (>100)
      const result2 = await staking.canValidate('account', 101)
      expect(result2.canValidate).toBe(false)
      expect(result2.reason).toContain('Commission must be between 0 and 100')
    })
  })

  describe('Account Queries', () => {
    test('should handle non-existent staking info gracefully', async () => {
      const info = await staking.getStakingInfo('non-existent-account')
      expect(info).toBeNull()
    })

    test('should handle non-existent nominations gracefully', async () => {
      const targets = await staking.getNominatorTargets('non-existent-account')
      expect(targets).toBeNull()
    })

    test('should handle non-existent slashing spans gracefully', async () => {
      const spans = await staking.getSlashingSpans('non-existent-account')
      expect(spans).toBeNull()
    })

    test('should get unbonding info for non-bonded account', async () => {
      const info = await staking.getUnbondingInfo('non-existent-account')

      expect(info).toBeDefined()
      expect(info.amount).toBe(0n)
      expect(Array.isArray(info.eras)).toBe(true)
      expect(info.eras.length).toBe(0)
    })
  })

  describe('Network Queries', () => {
    test('should get minimum active bond info', async () => {
      const info = await staking.getMinActiveBond()

      expect(info).toBeDefined()
      if (info) {
        expect(typeof info.minBond).toBe('bigint')
        expect(typeof info.activeNominators).toBe('number')
        expect(typeof info.maxNominators).toBe('number')
      }
    })
  })
})
