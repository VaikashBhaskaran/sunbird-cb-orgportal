import { CreateEventComponent } from './create-event.component'
import { EventsService } from '../../services/events.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils-v2'
import { ChangeDetectorRef } from '@angular/core'
import { ProfileV2UtillService } from '../../../home/services/home-utill.service'
import { of, throwError } from 'rxjs'
import { ParticipantsComponent } from '../../components/participants/participants.component'
import { SuccessComponent } from '../../components/success/success.component'

describe('CreateEventComponent', () => {
	let component: CreateEventComponent
	let mockEventsService: jest.Mocked<EventsService>
	let mockSnackBar: jest.Mocked<MatSnackBar>
	let mockMatDialog: jest.Mocked<MatDialog>
	let mockRouter: jest.Mocked<Router>
	let mockConfigService: jest.Mocked<ConfigurationsService>
	let mockChangeDetectorRef: jest.Mocked<ChangeDetectorRef>
	let mockActivatedRoute: Partial<ActivatedRoute>
	let mockEvents: jest.Mocked<EventService>
	let mockProfileUtilService: jest.Mocked<ProfileV2UtillService>

	beforeEach(() => {
		// Create mock services
		mockEventsService = {
			crreateAsset: jest.fn(),
			uploadFile: jest.fn(),
			uploadCoverImage: jest.fn(),
			updateEvent: jest.fn(),
			createEvent: jest.fn(),
			publishEvent: jest.fn()
		} as unknown as jest.Mocked<EventsService>

		mockSnackBar = {
			open: jest.fn()
		} as unknown as jest.Mocked<MatSnackBar>

		mockMatDialog = {
			open: jest.fn().mockReturnValue({
				afterClosed: jest.fn().mockReturnValue(of(null))
			})
		} as unknown as jest.Mocked<MatDialog>

		mockRouter = {
			navigate: jest.fn()
		} as unknown as jest.Mocked<Router>

		mockConfigService = {
			userProfile: {
				userId: 'test-user-id',
				userName: 'testUser',
				departmentName: 'Test Department',
				rootOrgId: 'test-org-id'
			}
		} as unknown as jest.Mocked<ConfigurationsService>

		mockChangeDetectorRef = {
			detectChanges: jest.fn()
		} as unknown as jest.Mocked<ChangeDetectorRef>

		mockActivatedRoute = {
			// snapshot: {
			// 	data: {
			// 		configService: {
			// 			userProfile: {
			// 				userId: 'route-user-id',
			// 				userName: 'routeUser',
			// 				departmentName: 'Route Department',
			// 				rootOrgId: 'route-org-id'
			// 			}
			// 		}
			// 	}
			// }
		}

		mockEvents = {
			raiseInteractTelemetry: jest.fn()
		} as unknown as jest.Mocked<EventService>

		mockProfileUtilService = {
			emailTransform: jest.fn().mockReturnValue('transformed@email.com')
		} as unknown as jest.Mocked<ProfileV2UtillService>

		// Setup document mockups for file upload handling
		global.document = {
			getElementById: jest.fn().mockReturnValue({
				click: jest.fn()
			})
		} as any

		// Create component
		component = new CreateEventComponent(
			mockSnackBar,
			mockEventsService,
			mockMatDialog,
			mockRouter,
			mockConfigService,
			mockChangeDetectorRef,
			mockActivatedRoute as ActivatedRoute,
			mockEvents,
			mockProfileUtilService
		)
	})

	it('should initialize properly', () => {
		// ngOnInit narrows timeArr to the slots still ahead of the current clock time and
		// then reads timeArr[0], so it depends on when the suite runs - and throws outright
		// after 23:30, when nothing is left. Pin the clock to midday so this is
		// deterministic. The nightly crash is recorded in product-bugs.md.
		jest.useFakeTimers().setSystemTime(new Date('2025-03-15T12:00:00'))

		// Spy on ngOnInit
		jest.spyOn(component, 'ngOnInit')

		// Call ngOnInit
		component.ngOnInit()

		// Verify ngOnInit was called
		expect(component.ngOnInit).toHaveBeenCalled()

		// Check that form is initialized
		expect(component.createEventForm).toBeDefined()
		expect(component.tabsData.length).toBe(4)
		expect(component.createEventForm.get('eventType')?.value).toBe('Webinar')
		expect(component.createEventForm.get('eventDurationHours')?.value).toBe(0)
		expect(component.createEventForm.get('eventDurationMinutes')?.value).toBe(30)

		jest.useRealTimers()
	})

	it('should get user profile from ConfigService when available', () => {
		expect(component.userId).toBe('test-user-id')
		expect(component.username).toBe('testUser')
		expect(component.department).toBe('Test Department')
	})

	it('should handle tab clicks correctly', () => {
		// Mock document.getElementById
		document.getElementById = jest.fn().mockReturnValue({
			scrollIntoView: jest.fn()
		})

		// tabsData is populated during init; onSideNavTabClick iterates it.
		component.tabsData = [{ key: 'datetime', name: 'Date and Time' }] as any

		// Call the tab click method
		component.onSideNavTabClick('datetime')

		// Verify current tab is updated
		expect(component.currentTab).toBe('datetime')

		// Verify telemetry event is raised
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
			expect.objectContaining({
				type: expect.any(String),
				subType: expect.any(String)
			}),
			{}
		)
	})

	it('should open participants dialog', () => {
		// Call the openDialog method
		component.openDialog()

		// Verify dialog was opened
		expect(mockMatDialog.open).toHaveBeenCalledWith(
			ParticipantsComponent,
			expect.objectContaining({
				width: '850px',
				height: '600px'
			})
		)

		// Verify telemetry event is raised
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
	})

	it('should add presenters when dialog returns data', () => {
		// Setup dialog to return data
		const mockResponse = {
			data: {
				'0': {
					firstName: 'John',
					id: 'user1',
					profileDetails: {
						personalDetails: {
							primaryEmail: 'john@example.com'
						}
					}
				}
			}
		}

		mockMatDialog.open.mockReturnValue({
			afterClosed: jest.fn().mockReturnValue(of(mockResponse))
		} as any)

		// Call the openDialog method. afterClosed() emits synchronously here, so
		// openDialog has already forwarded the response to addPresenters by the time it
		// returns - calling addPresenters again would add every presenter twice.
		component.openDialog()

		// Verify presenters and participants arrays are updated
		expect(component.presentersArr.length).toBe(1)
		expect(component.participantsArr.length).toBe(1)
		expect(component.presentersArr[0].name).toBe('John')
		expect(component.participantsArr[0].email).toBe('transformed@email.com')

		// Verify form control is updated
		expect(component.createEventForm.get('presenters')?.value).toBe(component.presentersArr)
	})

	it('should handle file selection for event picture', () => {
		// Mock FileReader
		const mockFileReader = {
			onload: null,
			readAsDataURL: jest.fn().mockImplementation(function () {
				//	this.onload()
			}),
			result: 'data:image/jpeg;base64,mockImageData'
		}

		global.FileReader = jest.fn(() => mockFileReader) as any

		// Mock file
		const mockFile = new File([''], 'filename', { type: 'image/jpeg' })
		const mockEvent = {
			target: {
				files: [mockFile]
			}
		}

		// Setup service responses
		mockEventsService.crreateAsset.mockReturnValue(of({
			result: { identifier: 'asset-123' }
		}))

		mockEventsService.uploadFile.mockReturnValue(of({
			result: { artifactUrl: 'http://example.com/image.jpg' }
		}))

		// Call the file select method
		component.onFileSelect(mockEvent)

		// Verify form control is updated
		expect(component.imageSrc).toBe(mockFile)
		expect(component.createEventForm.get('eventPicture')?.value).toBe(mockFile)

		// Verify asset creation API was called
		expect(mockEventsService.crreateAsset).toHaveBeenCalledWith(expect.objectContaining({
			request: expect.objectContaining({
				content: expect.objectContaining({
					mimeType: 'image/jpeg',
					creator: component.username
				})
			})
		}))

		// Verify file upload API was called
		expect(mockEventsService.uploadFile).toHaveBeenCalledWith(
			'asset-123',
			expect.any(FormData)
		)

		// Verify eventimageURL is set
		expect(component.eventimageURL).toBe('http://example.com/image.jpg')
	})

	it('should handle event date change', () => {
		// Mock date values
		const today = new Date()
		const todayEvent = {
			value: today
		}

		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		const tomorrowEvent = {
			value: tomorrow
		}

		// Setup initial component state
		component.newtimearray = [{ value: '10:00' }]
		component.orgtimeArr = [{ value: '00:00' }, { value: '00:30' }]

		// Test with today's date
		component.updateDate(todayEvent)
		expect(component.timeArr).toBe(component.newtimearray)
		expect(component.todayTime).toBe('10:00')

		// Test with future date
		component.updateDate(tomorrowEvent)
		expect(component.timeArr).toBe(component.orgtimeArr)
		expect(component.todayTime).toBe('00:00')
	})

	it('should handle form submission', () => {
		// Configure form values
		component.createEventForm.patchValue({
			eventTitle: 'Test Event',
			summary: 'Test Summary',
			description: 'Test Description',
			agenda: 'Test Agenda',
			eventType: 'Webinar',
			eventDate: new Date('2025-03-15'),
			eventTime: '10:00',
			eventDurationHours: 1,
			eventDurationMinutes: 30,
			conferenceLink: 'https://example.com/meet',
			presenters: [{ id: 'user1', name: 'Presenter 1' }]
		})

		// Setup service mock returns
		mockEventsService.createEvent.mockReturnValue(of({
			result: { identifier: 'event-123', versionKey: 'v1' }
		}))

		mockEventsService.publishEvent.mockReturnValue(of({
			result: { publishStatus: 'SUCCESS' }
		}))

		// Call submit method
		component.onSubmit()

		// Verify loading state. createEvent's mock emits synchronously, so by the time
		// onSubmit returns the success handler has already cleared both flags again.
		expect(component.disableCreateButton).toBe(false)
		expect(component.displayLoader).toBe(false)

		// Verify APIs were called
		expect(mockEventsService.createEvent).toHaveBeenCalledWith(expect.objectContaining({
			request: expect.objectContaining({
				event: expect.objectContaining({
					name: 'Test Event',
					description: 'Test Description',
					duration: 90, // 1h30m in minutes
					startTime: '10:00:00+05:30'
				})
			})
		}))

		// Verify publish was called
		expect(mockEventsService.publishEvent).toHaveBeenCalledWith(
			'event-123',
			expect.objectContaining({
				request: expect.objectContaining({
					event: expect.objectContaining({
						identifier: 'event-123',
						versionKey: 'v1',
						status: 'Live'
					})
				})
			})
		)

		// Verify success dialog was opened
		expect(mockMatDialog.open).toHaveBeenCalledWith(
			SuccessComponent,
			expect.objectContaining({
				data: expect.objectContaining({
					result: expect.objectContaining({
						publishStatus: 'SUCCESS'
					})
				})
			})
		)
	})

	it('should handle error in form submission', () => {
		// Configure form values
		component.createEventForm.patchValue({
			eventTitle: 'Test Event',
			summary: 'Test Summary',
			description: 'Test Description',
			agenda: 'Test Agenda',
			eventType: 'Webinar',
			eventDate: new Date('2025-03-15'),
			eventTime: '10:00',
			eventDurationHours: 0,
			eventDurationMinutes: 0, // Invalid duration
			conferenceLink: 'https://example.com/meet',
			presenters: [{ id: 'user1', name: 'Presenter 1' }]
		})

		// Call submit method
		component.onSubmit()

		// Verify error handling
		expect(mockSnackBar.open).toHaveBeenCalledWith('Duration cannot be zero', 'X', expect.any(Object))
		expect(component.disableCreateButton).toBe(false)
		expect(component.displayLoader).toBe(false)
	})

	it('should handle API error in event creation', () => {
		// Configure form values
		component.createEventForm.patchValue({
			eventTitle: 'Test Event',
			summary: 'Test Summary',
			description: 'Test Description',
			agenda: 'Test Agenda',
			eventType: 'Webinar',
			eventDate: new Date('2025-03-15'),
			eventTime: '10:00',
			eventDurationHours: 1,
			eventDurationMinutes: 30,
			conferenceLink: 'https://example.com/meet',
			presenters: [{ id: 'user1', name: 'Presenter 1' }]
		})

		// Mock API error
		mockEventsService.createEvent.mockReturnValue(throwError({ error: 'Error:API failed' }))

		// Call submit method
		component.onSubmit()

		// Verify error handling
		expect(mockSnackBar.open).toHaveBeenCalledWith('API failed', 'X', expect.any(Object))
		expect(component.disableCreateButton).toBe(false)
		expect(component.displayLoader).toBe(false)
	})

	it('should navigate to events list', () => {
		// Call goToList method
		component.goToList()

		// Verify navigation
		expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/events'])

		// Verify telemetry
		expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
	})

	it('should filter special characters in input', () => {
		// Test valid characters
		expect(component.omit_special_char({ charCode: 65 })).toBe(true) // 'A'
		expect(component.omit_special_char({ charCode: 97 })).toBe(true) // 'a'
		expect(component.omit_special_char({ charCode: 49 })).toBe(true) // '1'
		expect(component.omit_special_char({ charCode: 32 })).toBe(true) // space

		// Test invalid characters
		expect(component.omit_special_char({ charCode: 33 })).toBe(false) // '!'
		expect(component.omit_special_char({ charCode: 64 })).toBe(false) // '@'
	})

	it('should encode object to base64', () => {
		const testObj = { test: 'value' }
		const result = component.encodeToBase64(testObj)

		expect(result).toHaveProperty('data')
		expect(typeof result.data).toBe('string')
	})
})