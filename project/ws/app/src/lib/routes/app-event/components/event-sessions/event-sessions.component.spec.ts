// project/ws/app/src/lib/routes/app-event/components/event-sessions/event-sessions.component.spec.ts

import { EventSessionsComponent } from './event-sessions.component'
import { Subject } from 'rxjs'

describe('EventSessionsComponent', () => {
    let component: EventSessionsComponent
    let mockActivatedRoute: any
    let mockEventService: any
    let mockChangeDetectorRef: any
    let parentDataSubject: Subject<any>
    let originalDateParse: (dateString: string) => number

    // Mock data for testing
    const mockEventData = {
        data: {
            SessionCards: {
                Sessions: {
                    session1: {
                        SessionType: 'Keynote',
                        SessionImage: 'image1.jpg',
                        SessionTitle: 'Opening Keynote',
                        SessionStartTime: '2023-01-01T09:00:00',
                        SessionEndTime: '2023-01-01T10:00:00',
                        Speaker: 'John Doe',
                        Attendees: 150
                    },
                    session2: {
                        SessionType: 'Workshop',
                        SessionImage: 'image2.jpg',
                        SessionTitle: 'Angular Best Practices',
                        SessionStartTime: '2023-01-01T11:00:00',
                        SessionEndTime: '2023-01-01T12:30:00',
                        Speaker: 'Jane Smith',
                        Attendees: 75
                    }
                }
            }
        }
    }

    beforeEach(() => {
        // Store original Date.parse
        originalDateParse = Date.parse

        // Setup mocks
        parentDataSubject = new Subject()

        mockActivatedRoute = {
            parent: {
                data: parentDataSubject.asObservable()
            }
        }

        mockEventService = {
            bannerisEnabled: {
                next: jest.fn()
            }
        }

        mockChangeDetectorRef = {
            detectChanges: jest.fn()
        }

        // Mock Date constructor and Date.parse
        const fixedDate = new Date('2023-01-01T08:30:00')
        jest.spyOn(global, 'Date').mockImplementation(() => fixedDate)

        // Mock Date.parse as a global function
        global.Date.parse = jest.fn((dateString) => {
            if (dateString === fixedDate.toString()) {
                return fixedDate.getTime()
            }
            return originalDateParse(dateString)
        })

        // Create component with mocked dependencies
        component = new EventSessionsComponent(
            mockActivatedRoute as any,
            mockEventService as any,
            mockChangeDetectorRef as any
        )

        // Spy on component methods
        jest.spyOn(component, 'calculateTime')
    })

    afterEach(() => {
        jest.restoreAllMocks()
        // Restore original Date.parse
        global.Date.parse = originalDateParse
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should enable banner on init', () => {
        component.ngOnInit()
        expect(mockEventService.bannerisEnabled.next).toHaveBeenCalledWith(true)
    })

    it('should process session data correctly when parent route data is available', () => {
        // Init component
        component.ngOnInit()

        // Simulate parent route data emission
        parentDataSubject.next({ eventdata: mockEventData })

        // Verify data processing
        expect(component.sessionCard).toEqual(mockEventData.data.SessionCards)
        expect(component.data.length).toBe(2)
        expect(component.data[0].sessionID).toBe('Session1')
        expect(component.data[0].speakerName).toBe('John Doe')
        expect(component.data[1].speakerType).toBe('Workshop')
        expect(component.calculateTime).toHaveBeenCalled()
    })

    it('should calculate time correctly for sessions', () => {
        // Set up test data
        component.data = [
            {
                sessionID: 'Session1',
                speakerType: 'Keynote',
                speakerImage: 'image1.jpg',
                speakerKeynote: 'Opening Keynote',
                speakerDate: '2023-01-01T09:00:00',
                speakerName: 'John Doe',
                registeredUsers: '150',
                startTime: '2023-01-01T09:00:00',
                endTime: '2023-01-01T10:00:00'
            }
        ]

        // Call the method
        component.calculateTime()

        // Verify calculations
        // 09:00 - 08:30 = 30 minutes = 1,800,000 milliseconds
        // 10:00 - 08:30 = 90 minutes = 5,400,000 milliseconds
        expect(component.sessionStartTime[0]).toBe(1800000)
        expect(component.sessionEndTime[0]).toBe(5400000)
    })

    it('should update live speakers based on time', () => {
        jest.useFakeTimers()

        // Initialize component with data
        component.ngOnInit()
        parentDataSubject.next({ eventdata: mockEventData })

        // Manually set start and end times to test live session detection
        component.sessionStartTime = [-300000] // Started 5 minutes ago
        component.sessionEndTime = [1800000]   // Ends in 30 minutes
        component.data = [
            {
                sessionID: 'Session1',
                speakerType: 'Keynote',
                speakerImage: 'image1.jpg',
                speakerKeynote: 'Opening Keynote',
                speakerDate: '2023-01-01T09:00:00',
                speakerName: 'John Doe',
                registeredUsers: '150',
                startTime: '2023-01-01T09:00:00',
                endTime: '2023-01-01T10:00:00'
            }
        ]

        // ngOnInit subscribes to timer(0, 60000); under fake timers nothing has fired yet,
        // so advance the clock to run exactly one tick over the fixtures set above.
        jest.advanceTimersByTime(0)

        // Check that live speaker was identified
        expect(component.liveSpeaker.length).toBe(1)
        expect(component.liveSpeaker[0]).toEqual(component.data[0])
        expect(component.data[0].startRemainingTime).toBe(-360000) // Original time minus 1 minute
        expect(component.data[0].endRemaningTime).toBe(1740000)    // Original time minus 1 minute
        expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()

        jest.useRealTimers()
    })

    it('should unsubscribe from timer on destroy', () => {
        jest.useFakeTimers()

        // Drive the real flow so the component holds a real timer subscription: it is
        // created in ngOnInit once the parent route emits session data.
        component.ngOnInit()
        parentDataSubject.next({ eventdata: mockEventData })

        // currentSubscription is private, hence the cast.
        const subscription = (component as any).currentSubscription
        expect(subscription).toBeTruthy()
        const unsubscribeSpy = jest.spyOn(subscription, 'unsubscribe')

        // Call destroy
        component.ngOnDestroy()

        // Verify unsubscribe was called
        expect(unsubscribeSpy).toHaveBeenCalled()

        jest.useRealTimers()
    })

    it('should not throw error when currentSubscription is null on destroy', () => {
        // Ensure subscription is null
        //component.currentSubscription = null

        // Expect no error when destroying
        expect(() => {
            component.ngOnDestroy()
        }).not.toThrow()
    })

    it('should handle case when activatedRoute.parent is undefined', () => {
        // Mock route without parent
        mockActivatedRoute.parent = undefined

        // Re-create component with modified route
        component = new EventSessionsComponent(
            mockActivatedRoute as any,
            mockEventService as any,
            mockChangeDetectorRef as any
        )

        // Init should not throw error
        expect(() => {
            component.ngOnInit()
        }).not.toThrow()

        // Data should remain empty
        expect(component.data.length).toBe(0)
    })
})