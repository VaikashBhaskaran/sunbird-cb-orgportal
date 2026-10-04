import { EventBannerComponent } from './event-banner.component'
import { ChangeDetectorRef } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription, timer } from 'rxjs'

// Mock dependencies
jest.mock('rxjs', () => {
    const original = jest.requireActual('rxjs')
    return {
        ...original,
        timer: jest.fn(),
    }
})

describe('EventBannerComponent', () => {
    let component: EventBannerComponent
    let mockRouter: jest.Mocked<Router>
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockChangeDetectorRef: jest.Mocked<ChangeDetectorRef>
    let mockTimerSubscription: jest.Mocked<Subscription>
    let timerCallback: (value: number) => void

    beforeEach(() => {
        // Create mocks
        mockRouter = {
            navigate: jest.fn(),
        } as unknown as jest.Mocked<Router>

        mockActivatedRoute = {} as jest.Mocked<ActivatedRoute>

        mockChangeDetectorRef = {
            detectChanges: jest.fn(),
        } as unknown as jest.Mocked<ChangeDetectorRef>

        mockTimerSubscription = {
            unsubscribe: jest.fn(),
        } as unknown as jest.Mocked<Subscription>;

        // Mock timer to return our controllable subscription
        (timer as jest.Mock).mockImplementation(() => {
            return {
                subscribe: (callback: any) => {
                    timerCallback = callback
                    return mockTimerSubscription
                }
            }
        })

        // Instantiate component with mocked dependencies
        component = new EventBannerComponent(
            mockRouter,
            mockActivatedRoute,
            mockChangeDetectorRef
        )

        // Initialize component with test data
        component.data = {
            SessionCards: {
                Sessions: {
                    session1: {
                        SessionStartTime: new Date(Date.now() + 3600000).toISOString() // 1 hour in future
                    },
                    session2: {
                        SessionStartTime: new Date(Date.now() + 7200000).toISOString() // 2 hours in future
                    }
                }
            }
        }

        // Spy on component methods
        jest.spyOn(component, 'calculateTime')
        jest.spyOn(component, 'convertMinutes')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should initialize with default values', () => {
        expect(component.currentIndex).toBe(0)
        expect(component.slideInterval).toBeNull()
        expect(component.eventStarted).toBe(true)
        expect(component.bannerTemplates).toEqual(['registeredBanner', 'timeBanner'])
        expect(component.allStartTimeData).toEqual([])
        expect(component.allRemainingTime).toEqual([])
        expect(component.sessionTime).toEqual([])
    })

    test('should call calculateTime and setup timer subscription in ngOnInit', () => {
        // Reset the spy count (since constructor might call it)
        (component.calculateTime as jest.Mock).mockClear()

        // Call ngOnInit
        component.ngOnInit()

        // Verify calculateTime was called
        expect(component.calculateTime).toHaveBeenCalledTimes(1)

        // Verify timer was set up with correct parameters
        expect(timer).toHaveBeenCalledWith(0, 60000)
    })

    test('should unsubscribe from timer in ngOnDestroy', () => {
        // Setup subscription. currentSubscription is private and assigned in ngOnInit, so
        // drive that; the mocked timer hands back mockTimerSubscription.
        component.ngOnInit()
        mockTimerSubscription.unsubscribe.mockClear()

        // Call ngOnDestroy
        component.ngOnDestroy()

        // Verify unsubscribe was called
        expect(mockTimerSubscription.unsubscribe).toHaveBeenCalledTimes(1)
    })

    test('should not throw error when unsubscribing with null subscription', () => {
        // Ensure subscription is null
        //component.currentSubscription = null

        // This should not throw an error
        expect(() => component.ngOnDestroy()).not.toThrow()
    })

    test('should calculate time correctly in calculateTime method', () => {
        const now = new Date()
        const oneHourLater = new Date(now.getTime() + 3600000) // 1 hour in future
        const twoHoursLater = new Date(now.getTime() + 7200000) // 2 hours in future

        // Mock Date.parse to return consistent values for testing
        const originalDateParse = Date.parse
        global.Date.parse = jest.fn().mockImplementation((date) => {
            if (date === oneHourLater.toISOString()) return oneHourLater.getTime()
            if (date === twoHoursLater.toISOString()) return twoHoursLater.getTime()
            return now.getTime() // Return current time for Date()
        })

        // Set test data
        component.data = {
            SessionCards: {
                Sessions: {
                    session1: {
                        SessionStartTime: oneHourLater.toISOString()
                    },
                    session2: {
                        SessionStartTime: twoHoursLater.toISOString()
                    }
                }
            }
        }

        // Call the method
        component.calculateTime()

        // Verify results
        expect(component.allStartTimeData).toHaveLength(2)
        expect(component.allStartTimeData).toContain(oneHourLater.toISOString())
        expect(component.allStartTimeData).toContain(twoHoursLater.toISOString())

        expect(component.sessionTime).toHaveLength(2)
        expect(component.sessionTime[0]).toBeCloseTo(3600000, -3) // Within 1 second accuracy
        expect(component.sessionTime[1]).toBeCloseTo(7200000, -3) // Within 1 second accuracy

        // Restore original Date.parse
        global.Date.parse = originalDateParse
    })

    test('should convert minutes to hours and minutes correctly', () => {
        // Test various time conversions
        expect(component.convertMinutes(3600000)).toEqual({ hours: 1, mins: 0 })
        expect(component.convertMinutes(3660000)).toEqual({ hours: 1, mins: 1 })
        expect(component.convertMinutes(86400000)).toEqual({ hours: 24, mins: 0 }) // 1 day
        expect(component.convertMinutes(90000000)).toEqual({ hours: 25, mins: 0 }) // 1 day + 1 hour
    })

    test('should update slides with slideTo method', () => {
        // Initial state
        expect(component.currentIndex).toBe(0)

        // Call slideTo with valid index
        component.slideTo(1)
        expect(component.currentIndex).toBe(1)

        // Call slideTo with invalid index (negative)
        component.slideTo(-1)
        expect(component.currentIndex).toBe(1) // Should not change

        // Call slideTo with invalid index (too large)
        component.slideTo(10)
        expect(component.currentIndex).toBe(1) // Should not change
    })

    test('should navigate to sessions route when onClickRegister is called', () => {
        // Initial state
        component.isRegisteredUser = false

        // Call register method
        component.onClickRegister()

        // Verify navigation occurred
        expect(mockRouter.navigate).toHaveBeenCalledWith(['sessions'], { relativeTo: mockActivatedRoute })

        // Verify state changed
        expect(component.isRegisteredUser).toBe(true)
    })

    test('should update timer data when timer callback is triggered', () => {
        // Setup component
        component.ngOnInit();

        // Clear mocks to focus on timer callback behavior
        (component.convertMinutes as jest.Mock).mockClear()
        mockChangeDetectorRef.detectChanges.mockClear()

        // Add some session times for testing
        component.sessionTime = [3600000, 7200000] // 1 hour and 2 hours
        component.allRemainingTime = []

        // Trigger timer callback
        timerCallback(0)

        // Verify session times were updated (decreased by 60000ms = 1 minute)
        expect(component.sessionTime).toEqual([3540000, 7140000])

        // Verify convertMinutes was called twice (once for each session)
        expect(component.convertMinutes).toHaveBeenCalledTimes(2)
        expect(component.convertMinutes).toHaveBeenCalledWith(3540000)
        expect(component.convertMinutes).toHaveBeenCalledWith(7140000)

        // Verify change detection was triggered
        expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalledTimes(2)
    })
})