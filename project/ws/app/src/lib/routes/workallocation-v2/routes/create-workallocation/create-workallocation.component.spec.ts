import { CreateWorkallocationComponent } from './create-workallocation.component'
import { of, Subject } from 'rxjs'
import { Router } from '@angular/router'
import { EventService } from '@sunbird-cb/utils-v2'
import { WatStoreService } from '../../services/wat.store.service'
import { AllocationService } from '../../services/allocation.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ElementRef } from '@angular/core'

describe('CreateWorkallocationComponent', () => {
    let component: CreateWorkallocationComponent
    let mockWatStore: jest.Mocked<WatStoreService>
    let mockAllocateSrvc: jest.Mocked<AllocationService>
    let mockSnackBar: jest.Mocked<MatSnackBar>
    let mockRouter: jest.Mocked<Router>
    let mockRoute: any
    let mockDocument: Document
    let mockDialog: jest.Mocked<MatDialog>
    let mockEvents: jest.Mocked<EventService>

    // Subjects to simulate WatStoreService observables
    const activitiesGroupSubject = new Subject()
    const competencyGroupSubject = new Subject()
    const compGrpSubject = new Subject()
    const officerGroupSubject = new Subject()
    const errorCountSubject = new Subject()
    const currentProgressSubject = new Subject()
    const triggerSaveSubject = new Subject()

    beforeEach(() => {
        // Create mock objects for all dependencies
        mockWatStore = {
            getactivitiesGroup: activitiesGroupSubject.asObservable(),
            getcompetencyGroup: competencyGroupSubject.asObservable(),
            get_compGrp: compGrpSubject.asObservable(),
            getOfficerGroup: officerGroupSubject.asObservable(),
            getErrorCount: errorCountSubject.asObservable(),
            getCurrentProgress: currentProgressSubject.asObservable(),
            triggerSave: jest.fn().mockReturnValue(triggerSaveSubject.asObservable()),
            setworkOrderId: null,
            setOfficerId: null,
            getworkOrderId: 'mock-work-order-id',
            getOfficerId: 'mock-officer-id',
            clear: jest.fn(),
            getUpdateCompGroupById: jest.fn().mockImplementation((id) => ({
                compId: 'comp-123',
                compName: 'Competency Name',
                compDescription: 'Description',
                compLevel: 'Basic',
                compSource: 'Source',
                compArea: 'Area',
                compType: 'Type',
                localId: id
            })),
        } as unknown as jest.Mocked<WatStoreService>

        mockAllocateSrvc = {
            createAllocationV2: jest.fn().mockReturnValue(of({ success: true })),
            updateAllocationV2: jest.fn().mockReturnValue(of({ success: true })),
        } as unknown as jest.Mocked<AllocationService>

        mockSnackBar = {
            open: jest.fn(),
        } as unknown as jest.Mocked<MatSnackBar>

        mockRouter = {
            navigate: jest.fn(),
        } as unknown as jest.Mocked<Router>

        mockRoute = {
            params: of({ workorder: 'work-123', officerId: 'officer-456' }),
            snapshot: {
                data: {
                    pageData: {
                        data: {
                            externalUrls: [{ key: 'test', url: 'http://test.com' }]
                        }
                    },
                    watData: {
                        data: {
                            roleCompetencyList: [],
                            unmappedActivities: [],
                            unmappedCompetencies: [],
                            userName: 'Test User',
                            userId: 'user-123',
                            userEmail: 'test@example.com',
                            userPosition: 'Manager',
                            positionId: 'pos-123',
                            positionDescription: 'Manager position',
                            createdBy: 'creator-123',
                            id: 'wat-123',
                            createdByName: 'Creator Name'
                        }
                    }
                }
            }
        }

        mockDocument = document

        mockDialog = {
            open: jest.fn(),
        } as unknown as jest.Mocked<MatDialog>

        mockEvents = {
            raiseInteractTelemetry: jest.fn(),
            handleTabTelemetry: jest.fn(),
        } as unknown as jest.Mocked<EventService>

        component = new CreateWorkallocationComponent(
            mockWatStore,
            mockAllocateSrvc,
            mockSnackBar,
            mockRouter,
            mockRoute,
            mockDocument,
            mockDialog,
            mockEvents
        )

        // Mock ElementRef for ViewChild elements
        component.officerElement = { nativeElement: { offsetTop: 100 } } as ElementRef
        component.activitiesElement = { nativeElement: { offsetTop: 200 } } as ElementRef
        component.competenciesElement = { nativeElement: { offsetTop: 300 } } as ElementRef
        component.competencyDetailsElement = { nativeElement: { offsetTop: 400 } } as ElementRef
        component.mainWindowElement = { nativeElement: {} } as ElementRef
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should initialize with workOrderId and officerId from route params', () => {
        expect(mockWatStore.setworkOrderId).toBe('work-123')
        expect(mockWatStore.setOfficerId).toBe('officer-456')
    })

    it('should call setEditData and fetchFormsData on ngOnInit when officerId exists', () => {
        // Create spies for the methods to be tested
        const setEditDataSpy = jest.spyOn(component, 'setEditData' as any)
        const fetchFormsDataSpy = jest.spyOn(component, 'fetchFormsData' as any)
        const autoSaveSpy = jest.spyOn(component, 'autoSave' as any)

        component.ngOnInit()

        expect(setEditDataSpy).toHaveBeenCalled()
        expect(fetchFormsDataSpy).toHaveBeenCalled()
        expect(autoSaveSpy).toHaveBeenCalled()
    })

    it('should update offsets in ngAfterViewInit', () => {
        component.ngAfterViewInit()

        expect(component.officerOffset).toBe(-46) // 100 - 146
        expect(component.activitiesOffset).toBe(54) // 200 - 146
        expect(component.competenciesOffset).toBe(154) // 300 - 146
        expect(component.competencyDetailsOffset).toBe(254) // 400 - 146
    })

    it('should calculate selectedTab based on scroll position', () => {
        component.ngAfterViewInit() // Initialize offsets
        component.onScroll({})

        // Mock window.pageYOffset at different positions and check selectedTab
        Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true })
        component.onScroll({})
        expect(component.selectedTab).toBe('officer')

        Object.defineProperty(window, 'pageYOffset', { value: 60 })
        component.onScroll({})
        expect(component.selectedTab).toBe('activities')

        Object.defineProperty(window, 'pageYOffset', { value: 160 })
        component.onScroll({})
        expect(component.selectedTab).toBe('competencies')

        Object.defineProperty(window, 'pageYOffset', { value: 260 })
        component.onScroll({})
        expect(component.selectedTab).toBe('competencyDetails')
    })

    it('should filter components and update selectedTab', () => {
        const mockElement = {
            scrollIntoView: jest.fn()
        }

        component.filterComp(mockElement, 'activities')

        expect(component.selectedTab).toBe('activities')
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        })
    })

    it('should fetch and process edit data correctly', () => {
        component.setEditData()

        expect(component.editDataStruct).toEqual({
            roleCompetencyList: [],
            unmappedActivities: [],
            unmappedCompetencies: [],
            user: {
                officerName: 'Test User',
                userId: 'user-123',
                userEmail: 'test@example.com'
            },
            position: {
                userPosition: 'Manager',
                positionId: 'pos-123',
                positionDescription: 'Manager position'
            },
            createdBy: 'creator-123',
            id: 'wat-123',
            createdByName: 'Creator Name'
        })
    })

    it('should correctly provide edit data through getters', () => {
        component.setEditData()

        expect(component.getOfficerDataEdit).toEqual({
            usr: {
                officerName: 'Test User',
                userId: 'user-123',
                userEmail: 'test@example.com'
            },
            position: {
                userPosition: 'Manager',
                positionId: 'pos-123',
                positionDescription: 'Manager position'
            }
        })

        expect(component.getActivityDataEdit).toEqual({
            unmdA: [],
            list: []
        })

        expect(component.getCompDataEdit).toEqual({
            unmdC: [],
            list: []
        })
    })

    it('should subscribe to WatStoreService observables in fetchFormsData', () => {
        component.fetchFormsData()

        // Emit values to test subscription handling
        activitiesGroupSubject.next([{ groupName: 'Group1', activities: [] }])
        expect(component.dataStructure.activityGroups).toEqual([{ groupName: 'Group1', activities: [] }])

        competencyGroupSubject.next([{ roleName: 'Role1', competincies: [] }])
        expect(component.dataStructure.compGroups).toEqual([{ roleName: 'Role1', competincies: [] }])

        compGrpSubject.next([{ name: 'Comp1' }])
        expect(component.dataStructure.compDetails).toEqual([{ name: 'Comp1' }])

        officerGroupSubject.next({ officerName: 'Test Officer' })
        expect(component.dataStructure.officerFormData).toEqual({ officerName: 'Test Officer' })

        errorCountSubject.next(5)
        expect(component.dataStructure.errorCount).toBe(5)

        currentProgressSubject.next(50)
        expect(component.dataStructure.currentProgress).toBe(50)
    })

    it('should save WAT and navigate on successful save', () => {
        component.dataStructure = {
            officerFormData: {
                user: { userId: 'user-123', profileDetails: { personalDetails: { primaryEmail: 'user@example.com' } } },
                positionObj: { id: 'pos-123' },
                officerName: 'Test Officer',
                position: 'Manager',
                positionDescription: 'Manager Description'
            },
            activityGroups: [
                { activities: [{ activityName: 'Activity1', activityDescription: 'Desc1' }] },
                { groupName: 'Group1', groupDescription: 'Desc1', activities: [{ activityId: 'act-1', activityName: 'Activity1', activityDescription: 'Desc1' }] }
            ],
            compGroups: [
                { competincies: [{ compName: 'Comp1', compDescription: 'Desc1', localId: 'local-1' }] },
                { roleName: 'Group1', competincies: [{ compName: 'Comp2', compDescription: 'Desc2', localId: 'local-2' }] }
            ],
            currentProgress: 75,
            errorCount: 0
        }

        component.saveWAT()

        expect(mockAllocateSrvc.createAllocationV2).toHaveBeenCalled()
        expect(mockSnackBar.open).toHaveBeenCalledWith('Work order saved successfully!', 'X', { duration: 5000 })
        expect(mockWatStore.clear).toHaveBeenCalled()
        // workOrderId comes from the route params ('work-123'), which is what
        // getWorkOrderId returns once it is set.
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/drafts', 'work-123'])
    })

    it('should update WAT and navigate on successful update', () => {
        component.editDataStruct = {
            id: 'wat-123',
            createdBy: 'creator-123',
            createdByName: 'Creator Name'
        }

        component.dataStructure = {
            officerFormData: {
                user: { userId: 'user-123', userEmail: 'user@example.com' },
                positionObj: { positionId: 'pos-123' },
                officerName: 'Test Officer',
                position: 'Manager',
                positionDescription: 'Manager Description'
            },
            activityGroups: [
                { activities: [{ activityName: 'Activity1', activityDescription: 'Desc1' }] },
                { groupName: 'Group1', groupDescription: 'Desc1', activities: [{ activityId: 'act-1', activityName: 'Activity1', activityDescription: 'Desc1' }] }
            ],
            compGroups: [
                { competincies: [{ compName: 'Comp1', compDescription: 'Desc1', localId: 'local-1' }] },
                { roleName: 'Group1', competincies: [{ compName: 'Comp2', compDescription: 'Desc2', localId: 'local-2' }] }
            ],
            currentProgress: 75,
            errorCount: 0
        }

        // updateAllocationV2's result is piped through delay(500), so the handler only runs
        // once the clock has moved past it.
        jest.useFakeTimers()

        component.updateWat(false, false, true)

        expect(mockAllocateSrvc.updateAllocationV2).toHaveBeenCalled()

        jest.advanceTimersByTime(500)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Work order updated successfully!', 'X', { duration: 5000 })
        expect(mockWatStore.clear).toHaveBeenCalled()
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/drafts', 'work-123'])

        jest.useRealTimers()
    })
})