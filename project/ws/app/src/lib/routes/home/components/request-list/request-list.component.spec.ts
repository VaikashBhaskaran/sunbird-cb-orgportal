import { RequestListComponent } from './request-list.component'
import { of } from 'rxjs'
import { DatePipe } from '@angular/common'

// Mock services and dependencies
const mockDomSanitizer = {
    bypassSecurityTrustHtml: jest.fn((html) => html)
}

const mockProfileV2Service = {
    // Subscribed to during ngOnInit.
    getRequestList: jest.fn().mockReturnValue(of({ result: { data: [], count: 0 } })),
    markAsInvalid: jest.fn()
}

const mockActivatedRoute = {
    snapshot: {
        data: {
            configService: {
                userRoles: new Set(['mdo_leader']),
                userProfile: {
                    rootOrgId: 'test-org-id'
                }
            },
            pageData: {
                data: {
                    actionMenu: [
                        {
                            enabledFor: ['mdo_leader'],
                            isMdoLeader: false,
                            userAccess: false
                        }
                    ]
                }
            }
        }
    }
}

const mockDialog = {
    open: jest.fn().mockReturnValue({
        afterClosed: () => of('confirmed')
    })
}

const mockRouter = {
    navigate: jest.fn()
}

const mockSnackBar = {
    open: jest.fn()
}

const mockLoaderService = {
    changeLoaderState: jest.fn()
}

describe('RequestListComponent', () => {
    let component: RequestListComponent
    let datePipe: DatePipe

    beforeEach(() => {
        datePipe = new DatePipe('en-US')

        component = new RequestListComponent(
            mockDomSanitizer as any,
            mockProfileV2Service as any,
            datePipe,
            mockActivatedRoute as any,
            mockDialog as any,
            mockRouter as any,
            mockSnackBar as any,
            mockLoaderService as any
        )

        // Reset all mocks before each test
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
        expect(component.pageNo).toBe(0)
        // The component's default pageSize is 20.
        expect(component.pageSize).toBe(20)
        expect(component.tabledata).toBeDefined()
        expect(component.displayedColumns.length).toBe(9)
    })

    describe('ngOnInit', () => {
        it('should call getRequestList and hasAccess on initialization', () => {
            // Spy on the component methods
            jest.spyOn(component, 'getRequestList')
            jest.spyOn(component, 'hasAccess')

            component.ngOnInit()

            expect(component.getRequestList).toHaveBeenCalled()
            expect(component.hasAccess).toHaveBeenCalled()
            expect(component.rootOrgId).toBe('test-org-id')
        })
    })

    describe('hasAccess', () => {
        it('should set userAccess flag for action menu items', () => {
            component.ngOnInit()

            // Check if userAccess is set to true for mdo_leader
            expect(component.pageConfig.data.actionMenu[0].userAccess).toBe(true)
            expect(component.pageConfig.data.actionMenu[0].isMdoLeader).toBe(true)
        })
    })

    describe('getRequestList', () => {
        it('should fetch request list and update data source', () => {
            const mockResponse = {
                data: [
                    {
                        demand_id: 'DEM-001',
                        title: 'Test Request',
                        status: 'Assigned',
                        requestType: 'Broadcast',
                        assignedProvider: { providerName: 'Test Provider' },
                        createdOn: new Date().toISOString()
                    }
                ],
                totalCount: 1
            }

            mockProfileV2Service.getRequestList.mockReturnValue(of(mockResponse))

            component.ngOnInit()

            expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
            expect(mockProfileV2Service.getRequestList).toHaveBeenCalled()
            expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
            expect(component.requestCount).toBe(1)
            expect(component.dataSource).toBeDefined()
        })
    })

    describe('onChangePage', () => {
        it('should update page parameters and call getRequestList', () => {
            jest.spyOn(component, 'getRequestList')

            component.onChangePage({ pageIndex: 1, pageSize: 20 })

            expect(component.pageNo).toBe(1)
            expect(component.pageSize).toBe(20)
            expect(component.getRequestList).toHaveBeenCalled()
        })
    })

    describe('getStatusClass', () => {
        it('should return correct class name based on status', () => {
            expect(component.getStatusClass('Unassigned')).toBe('status-unassigned')
            expect(component.getStatusClass('Assigned')).toBe('status-assigned')
            expect(component.getStatusClass('Invalid')).toBe('status-invalid')
            expect(component.getStatusClass('Fulfill')).toBe('status-fullfill')
            expect(component.getStatusClass('InProgress')).toBe('status-inprogress')
            expect(component.getStatusClass('Unknown')).toBe('')
        })
    })

    describe('sanitizeHtml', () => {
        it('should call sanitizer with provided HTML', () => {
            const testHtml = '<p>Test</p>'
            component.sanitizeHtml(testHtml)
            expect(mockDomSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(testHtml)
        })
    })

    describe('onClickMenu', () => {
        const testItem = {
            demand_id: 'DEM-001',
            title: 'Test Request',
            status: 'Assigned',
            requestType: 'Broadcast'
        }

        it('should navigate to view form on viewContent action', () => {
            component.onClickMenu(testItem, 'viewContent')

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/home/create-request-form'],
                { queryParams: { id: 'DEM-001', name: 'view' } }
            )
        })

        it('should open confirmation dialog on invalidContent action', () => {
            jest.spyOn(component, 'showConformationModal')

            component.onClickMenu(testItem, 'invalidContent')

            expect(component.showConformationModal).toHaveBeenCalledWith(testItem, 'invalidContent')
        })

        it('should open assign list popup on assignContent action', () => {
            jest.spyOn(component, 'openAssignlistPopup')

            component.onClickMenu(testItem, 'assignContent')

            expect(component.openAssignlistPopup).toHaveBeenCalledWith(testItem)
        })

        it('should open assign list popup for broadcast requests on reAssignContent action', () => {
            jest.spyOn(component, 'openAssignlistPopup')

            component.onClickMenu(testItem, 'reAssignContent')

            expect(component.openAssignlistPopup).toHaveBeenCalledWith(testItem)
        })

        it('should open single reassign popup for non-broadcast requests on reAssignContent action', () => {
            jest.spyOn(component, 'openSingleReassignPopup')

            const nonBroadcastItem = { ...testItem, requestType: 'Direct' }
            component.onClickMenu(nonBroadcastItem, 'reAssignContent')

            expect(component.openSingleReassignPopup).toHaveBeenCalledWith(nonBroadcastItem)
        })

        it('should navigate to copy form on copyContent action', () => {
            component.onClickMenu(testItem, 'copyContent')

            expect(mockRouter.navigate).toHaveBeenCalledWith(
                ['/app/home/create-request-form'],
                { queryParams: { id: 'DEM-001', name: 'copy' } }
            )
        })
    })

    describe('invalidContent', () => {
        it('should call markAsInvalid service and refresh list on success', () => {
            const testItem = { demand_id: 'DEM-001' }
            mockProfileV2Service.markAsInvalid.mockReturnValue(of({ success: true }))

            jest.spyOn(component, 'getRequestList')
            jest.useFakeTimers()

            component.invalidContent(testItem)

            expect(mockProfileV2Service.markAsInvalid).toHaveBeenCalledWith({
                demand_id: 'DEM-001',
                newStatus: 'Invalid'
            })
            expect(mockSnackBar.open).toHaveBeenCalledWith('Marked as Invalid')

            jest.advanceTimersByTime(1000)
            expect(component.getRequestList).toHaveBeenCalled()
        })
    })

    describe('showConformationModal', () => {
        it('should open confirmation dialog and call invalidContent if confirmed', () => {
            const testItem = { demand_id: 'DEM-001' }
            jest.spyOn(component, 'invalidContent')

            component.showConformationModal(testItem, 'invalidContent')

            expect(mockDialog.open).toHaveBeenCalled()
            expect(component.invalidContent).toHaveBeenCalledWith(testItem)
        })
    })

    describe('getPointerEventsStyle', () => {
        it('should return auto for statuses that can be actioned', () => {
            const testItem = { status: 'Assigned' }
            const result = component.getPointerEventsStyle(testItem)
            expect(result['pointer-events']).toBe('auto')
        })

        it('should return none for statuses that cannot be actioned', () => {
            const testItem = { status: 'InProgress' }
            const result = component.getPointerEventsStyle(testItem)
            expect(result['pointer-events']).toBe('none')
        })
    })

    describe('handleClick', () => {
        it('should call onClickMenu for actionable statuses', () => {
            jest.spyOn(component, 'onClickMenu')

            const actionableItem = { status: 'Assigned' }
            component.handleClick(actionableItem)

            expect(component.onClickMenu).toHaveBeenCalledWith(actionableItem, 'assignContent')
        })

        it('should not call onClickMenu for non-actionable statuses', () => {
            jest.spyOn(component, 'onClickMenu')

            const nonActionableItem = { status: 'InProgress' }
            component.handleClick(nonActionableItem)

            expect(component.onClickMenu).not.toHaveBeenCalled()
        })
    })
})