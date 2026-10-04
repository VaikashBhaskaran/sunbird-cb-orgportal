import { Router } from '@angular/router'
import { DomSanitizer } from '@angular/platform-browser'
import { of } from 'rxjs'
import { EventService } from '@sunbird-cb/utils-v2'
import { ApprovalPendingComponent } from './approval-pending.component'
import { ApprovalsService } from '../../../services/approvals.service'
import { ReportsVideoComponent } from '../../reports-video/reports-video.component'

import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

describe('ApprovalPendingComponent', () => {
	let component: ApprovalPendingComponent
	let mockRouter: jest.Mocked<Router>
	let mockApprService: jest.Mocked<ApprovalsService>
	let mockActiveRouter: any
	let mockRoute: any
	let mockEvents: jest.Mocked<EventService>
	let mockDialog: jest.Mocked<MatDialog>
	let mockSanitizer: jest.Mocked<DomSanitizer>
	let mockSnackbar: jest.Mocked<MatSnackBar>
	let mockLoaderService: any
	let localStorage: any

	beforeEach(() => {
		// Create mock for localStorage
		localStorage = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			removeItem: jest.fn()
		}
		Object.defineProperty(window, 'localStorage', { value: localStorage })

		// Mock router
		mockRouter = {
			navigate: jest.fn(),
		} as unknown as jest.Mocked<Router>

		// Mock approvals service
		mockApprService = {
			// The component subscribes to both, so they need an observable by default.
			// Individual tests still override these with their own payloads.
			getApprovalsList: jest.fn().mockReturnValue(of({ result: { count: 0, data: [] } })),
			handleWorkflow: jest.fn().mockReturnValue(of({}))
		} as unknown as jest.Mocked<ApprovalsService>

		// Mock activated route with parent data
		mockActiveRouter = {
			parent: {
				snapshot: {
					data: {
						configService: {
							unMappedUser: {
								channel: 'testDepartment'
							}
						}
					}
				}
			}
		}

		// Mock route
		mockRoute = {
			parent: {
				snapshot: {
					data: {
						configService: {}
					}
				}
			},
			snapshot: {
				routeConfig: {
					path: 'profileverification'
				}
			}
		}

		// Mock events service
		mockEvents = {
			handleTabTelemetry: jest.fn(),
			raiseInteractTelemetry: jest.fn()
		} as unknown as jest.Mocked<EventService>

		// Mock dialog
		mockDialog = {
			open: jest.fn()
		} as unknown as jest.Mocked<MatDialog>

		// Mock sanitizer
		mockSanitizer = {
			bypassSecurityTrustHtml: jest.fn().mockImplementation((html) => html)
		} as unknown as jest.Mocked<DomSanitizer>

		// Mock snackbar
		mockSnackbar = {
			open: jest.fn()
		} as unknown as jest.Mocked<MatSnackBar>

		// Mock loader service
		mockLoaderService = {
			changeLoad: {
				next: jest.fn()
			},
			changeLoaderState: jest.fn()
		}

		// Create component instance
		component = new ApprovalPendingComponent(
			mockRouter,
			mockApprService,
			mockActiveRouter,
			mockRoute,
			mockEvents,
			mockDialog,
			mockSanitizer,
			mockSnackbar,
			mockLoaderService
		)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('initialization', () => {
		it('should initialize with department name from config', () => {
			component.ngOnInit()
			expect(component.departName).toBe('testDepartment')
		})

		it('should set current filter from route path', () => {
			component.ngOnInit()
			expect(component.currentFilter).toBe('profileverification')
		})

		it('should call fetchApprovals and fetchTransfers on init', () => {
			const fetchApprovalsSpy = jest.spyOn(component, 'fetchApprovals')
			const fetchTransfersSpy = jest.spyOn(component, 'fetchTransfers')

			component.ngOnInit()

			expect(fetchApprovalsSpy).toHaveBeenCalledWith('')
			expect(fetchTransfersSpy).toHaveBeenCalledWith(1)
		})

		it('should initialize reportsNoteList with correct values', () => {
			component.ngOnInit()
			expect(component.reportsNoteList.length).toBe(3)
			expect(component.reportsNoteList[0]).toContain('Profile Verifications')
		})
	})

	describe('sanitizeHtml', () => {
		it('should call sanitizer.bypassSecurityTrustHtml with provided html', () => {
			const testHtml = '<div>Test</div>'
			component.sanitizeHtml(testHtml)
			expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(testHtml)
		})
	})

	describe('openVideoPopup', () => {
		it('should open dialog with ReportsVideoComponent', () => {
			component.openVideoPopup()
			expect(mockDialog.open).toHaveBeenCalledWith(
				ReportsVideoComponent,
				expect.objectContaining({
					data: {
						videoLink: 'https://www.youtube.com/embed/tgbNymZ7vqY?autoplay=1&mute=1',
					},
					disableClose: true,
					width: '50%',
					height: '60%',
					panelClass: 'overflow-visable',
				})
			)
		})
	})

	describe('filter', () => {
		it('should update current filter and reset pagination when filter changes', () => {
			// Setup
			component.currentFilter = 'profileverification'
			//	const fetchApprovalsSpy = jest.spyOn(component, 'fetchApprovals')

			// Call with a new filter
			component.filter('transfers')

			// Verify result
			expect(component.currentFilter).toBe('transfers')
			expect(component.pageIndex).toBe(0)
			expect(component.currentOffset).toBe(0)
			expect(component.searchfilterValue).toBe('')
		})

		it('should retrieve cached approvals when filter is profileverification and cache exists', () => {
			// Setup
			localStorage.getItem.mockImplementation((key: any) => {
				if (key === 'profileverificationOffset') return '1'
				return null
			})
			component.currentFilter = 'transfers'
			const retrieveCachedApprovalsSpy = jest.spyOn(component, 'retrieveCachedApprovals')

			// Call filter with same value
			component.filter('profileverification')

			// Verify result
			expect(component.currentFilter).toBe('profileverification')
			expect(component.pageIndex).toBe(1) // From localStorage
			expect(retrieveCachedApprovalsSpy).toHaveBeenCalled()
		})
	})

	describe('onApprovalClick', () => {
		it('should navigate to approval detail page with correct ID', () => {
			// Setup mock approval object
			const mockApproval = {
				userWorkflow: {
					userInfo: {
						wid: 'test-wid-123'
					}
				}
			}

			// Call method
			component.onApprovalClick(mockApproval)

			// Verify navigation
			expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/approvals/test-wid-123/to-approve'])

			// Verify telemetry event was raised
			expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
		})
	})

	describe('fetchApprovals', () => {
		it('should fetch approval data and update state when department name exists', () => {
			// Setup
			component.departName = 'testDepartment'
			const mockResponse = {
				result: {
					count: 10,
					data: [
						{
							userInfo: {
								first_name: 'Test User',
								wid: 'user-123',
								tag: 'test-tag'
							},
							wfInfo: [
								{
									createdOn: '2023-01-01T00:00:00.000Z'
								}
							]
						}
					]
				}
			}

			mockApprService.getApprovalsList.mockReturnValue(of(mockResponse))

			// Call method
			component.fetchApprovals('')

			// Verify API call
			expect(mockApprService.getApprovalsList).toHaveBeenCalledWith(expect.objectContaining({
				serviceName: 'profile',
				applicationStatus: 'SEND_FOR_APPROVAL',
				deptName: 'testDepartment'
			}))

			// Verify data processing
			expect(localStorage.setItem).toHaveBeenCalledWith('profileverificationDataCache', expect.any(String))
			expect(localStorage.setItem).toHaveBeenCalledWith('profileverificationCacheTimestamp', expect.any(String))
			expect(component.profileVerificationData.length).toBe(1)
			expect(component.showApproveALL).toBe(true)
		})

		it('should show snackbar message when department name is missing', () => {
			// Setup
			component.departName = ''

			// Call method
			component.fetchApprovals('')

			// Verify snackbar
			expect(mockSnackbar.open).toHaveBeenCalledWith(
				'Please connect to your SPV admin, to update MDO name.'
			)
		})
	})

	describe('fetchTransfers', () => {
		it('should fetch transfer data and update state when department name exists', () => {
			// Setup
			component.departName = 'testDepartment'
			const mockResponse = {
				result: {
					count: 5,
					data: [
						{
							userInfo: {
								first_name: 'Transfer User',
								wid: 'user-456',
								tag: 'transfer-tag'
							},
							wfInfo: [
								{
									createdOn: '2023-02-01T00:00:00.000Z',
									orgTansferRequest: true
								}
							]
						}
					]
				}
			}

			mockApprService.getApprovalsList.mockReturnValue(of(mockResponse))
			component.currentFilter = 'transfers'
			component.tabChange = 1

			// Call method
			component.fetchTransfers(20)

			// Verify API call
			expect(mockApprService.getApprovalsList).toHaveBeenCalledWith(expect.objectContaining({
				serviceName: 'profile',
				applicationStatus: 'SEND_FOR_APPROVAL',
				requestType: ['ORG_TRANSFER'],
				deptName: 'testDepartment'
			}))

			// Verify data processing
			expect(localStorage.setItem).toHaveBeenCalledWith('transfersDataCache', expect.any(String))
			expect(localStorage.setItem).toHaveBeenCalledWith('transfersCacheTimestamp', expect.any(String))
		})
	})

	describe('onSearch', () => {
		it('should update search filter and reset pagination', () => {
			// Setup
			component.currentFilter = 'profileverification'
			component.totalProfileVerificationRecords = 100
			const getSortOrderSpy = jest.spyOn(component, 'getSortOrder')
			const fetchApprovalsSpy = jest.spyOn(component, 'fetchApprovals')

			// Mock data
			component.profileVerificationData = [
				{ fullname: 'John Doe' },
				{ fullname: 'Jane Smith' }
			]

			// Call method with search text
			component.onSearch({ searchText: 'John', sortOrder: { sortOrder: 'alphabetical' } })

			// Verify results
			expect(component.pageIndex).toBe(0)
			expect(component.searchfilterValue).toBe('john')
			expect(getSortOrderSpy).toHaveBeenCalled()
			expect(fetchApprovalsSpy).toHaveBeenCalled()
			expect(component.profileVerificationData.length).toBe(1)
		})
	})

	describe('onPaginateChange', () => {
		it('should update pagination settings and clear cache', () => {
			// Setup
			component.currentFilter = 'profileverification'
			const filterDataSpy = jest.spyOn(component, 'filterData')

			// Call method with page event
			component.onPaginateChange({ pageIndex: 2, pageSize: 30, length: 100 } as any)

			// Verify results
			expect(component.pageIndex).toBe(2)
			expect(component.limit).toBe(30)
			expect(localStorage.removeItem).toHaveBeenCalledWith('profileverificationDataCache')
			expect(localStorage.removeItem).toHaveBeenCalledWith('profileverificationCacheTimestamp')
			expect(localStorage.setItem).toHaveBeenCalledWith('profileverificationOffset', '2')
			expect(localStorage.setItem).toHaveBeenCalledWith('profileverificationPageSize', '30')
			expect(filterDataSpy).toHaveBeenCalled()
		})
	})

	describe('onApproveALL', () => {
		it('should approve all profile verification requests', () => {
			// Setup mock data
			component.profileVerificationData = [
				{
					userWorkflow: {
						userInfo: { wid: 'user-123' },
						wfInfo: [
							{
								userId: 'user-123',
								applicationId: 'app-123',
								wfId: 'wf-123',
								updateFieldValues: '{"field":"value"}'
							}
						]
					}
				}
			]

			mockApprService.handleWorkflow.mockReturnValue(of({ result: { data: {} } }))
			jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => cb() as any)

			// Call method
			component.onApproveALL()

			// Verify results
			expect(component.disableApproveALL).toBe(true)
			expect(mockApprService.handleWorkflow).toHaveBeenCalledWith(expect.objectContaining({
				action: 'APPROVE',
				applicationId: 'app-123',
				wfId: 'wf-123'
			}))
			expect(mockSnackbar.open).toHaveBeenCalledWith('All requests are Approved', 'X', { duration: 5000 })
		})
	})

	describe('retrieveCachedApprovals', () => {
		it('should use cached data if available and not expired', () => {
			// Setup mock cached data
			const now = new Date().getTime()
			const fiveMinutesAgo = now - 4 * 60 * 1000 // 4 minutes ago
			const mockCachedData = JSON.stringify([{ id: 1, name: 'Test' }])

			localStorage.getItem.mockImplementation((key: any) => {
				if (key === 'profileverificationDataCache') return mockCachedData
				if (key === 'profileverificationCacheTimestamp') return fiveMinutesAgo.toString()
				if (key === 'profileverificationTotalRecords') return '10'
				return null
			})

			const fetchTransfersSpy = jest.spyOn(component, 'fetchTransfers')

			// Call method
			component.retrieveCachedApprovals()

			// Verify results
			expect(component.profileVerificationData).toEqual([{ id: 1, name: 'Test' }])
			expect(fetchTransfersSpy).not.toHaveBeenCalled()
		})

		it('should fetch fresh data if cache is expired', () => {
			// Setup expired cache
			const now = new Date().getTime()
			const sixMinutesAgo = now - 6 * 60 * 1000 // 6 minutes ago
			const mockCachedData = JSON.stringify([{ id: 1, name: 'Test' }])

			localStorage.getItem.mockImplementation((key: any) => {
				if (key === 'profileverificationDataCache') return mockCachedData
				if (key === 'profileverificationCacheTimestamp') return sixMinutesAgo.toString()
				return null
			})

			const fetchTransfersSpy = jest.spyOn(component, 'fetchTransfers')

			// Call method
			component.retrieveCachedApprovals()

			// Verify fresh data is fetched
			expect(fetchTransfersSpy).toHaveBeenCalled()
		})
	})
})
