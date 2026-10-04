import { CompetencyLabelsComponent } from './competency-labels.component'
import { BehaviorSubject, of } from 'rxjs'
import { UntypedFormBuilder } from '@angular/forms'

// Mock dependencies
describe('CompetencyLabelsComponent', () => {
    let component: CompetencyLabelsComponent
    let mockChangeDetector: any
    let mockFormBuilder: any
    let mockAllocateService: any
    let mockWatStore: any
    let mockSnackBar: any
    let mockDialog: any
    let mockActivatedRoute: any
    let mockDialogRef: any

    beforeEach(() => {
        // Mock dependencies
        mockChangeDetector = {
            detectChanges: jest.fn()
        }

        mockFormBuilder = {
            group: jest.fn().mockReturnValue({}),
            array: jest.fn().mockReturnValue([]),
            control: jest.fn()
        }

        mockAllocateService = {
            onSearchUser: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
            onSearchCompetency: jest.fn().mockReturnValue(of({ responseData: [] }))
        }

        mockWatStore = {
            getactivitiesGroup: new BehaviorSubject([]),
            getID: 'mock-id',
            setgetcompetencyGroup: jest.fn(),
            getUpdateCompGroupById: jest.fn().mockReturnValue({})
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({
                ok: true,
                data: {
                    compId: 'comp-1',
                    compName: 'Competency 1',
                    compDescription: 'Description',
                    compLevel: 'Level 1',
                    compType: 'Type 1',
                    compArea: 'Area 1',
                    compSource: 'Source 1',
                    levelList: []
                }
            })),
            componentInstance: {}
        }

        mockDialog = {
            open: jest.fn().mockReturnValue(mockDialogRef)
        }

        mockActivatedRoute = {
            snapshot: {
                data: {
                    pageData: {
                        data: {
                            levels: []
                        }
                    }
                }
            }
        }

        // Create actual FormBuilder for certain tests
        const realFormBuilder = new UntypedFormBuilder()
        mockFormBuilder.group = realFormBuilder.group.bind(realFormBuilder)
        mockFormBuilder.array = realFormBuilder.array.bind(realFormBuilder)

        // Create component instance
        component = new CompetencyLabelsComponent(
            mockChangeDetector,
            mockFormBuilder,
            mockAllocateService,
            mockWatStore,
            mockSnackBar,
            mockDialog,
            mockActivatedRoute
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Initialization', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize activityForm in ngOnInit', () => {
            // Setup form spies
            jest.spyOn(component, 'createForm')
            jest.spyOn(component, 'initListen')

            // Call ngOnInit
            component.ngOnInit()

            // Verify form creation and initialization
            expect(component.createForm).toHaveBeenCalled()
            expect(component.initListen).toHaveBeenCalled()
        })

        it('should subscribe to watStore.getactivitiesGroup in ngOnInit', () => {
            // Setup spy
            const subscriptionSpy = jest.spyOn(mockWatStore.getactivitiesGroup, 'subscribe')

            // Call ngOnInit
            component.ngOnInit()

            // Verify subscription
            expect(subscriptionSpy).toHaveBeenCalled()
        })

        it('should unsubscribe on ngOnDestroy', () => {
            // Setup
            const unsubscribeSpy = jest.spyOn(component['unsubscribe'], 'next')
            const activitySubscriptionSpy = { unsubscribe: jest.fn() }
            component['activitySubscription'] = activitySubscriptionSpy

            // Call ngOnDestroy
            component.ngOnDestroy()

            // Verify unsubscriptions
            expect(unsubscribeSpy).toHaveBeenCalled()
            expect(activitySubscriptionSpy.unsubscribe).toHaveBeenCalled()
        })
    })

    describe('Form Management', () => {
        beforeEach(() => {
            // Call createForm to set up the form
            component.createForm()
        })

        it('should add a new group with createForm', () => {
            // Spy on addNewGroup method
            jest.spyOn(component, 'addNewGroup')

            // Call createForm
            component.createForm()

            // Verify addNewGroup was called
            expect(component.addNewGroup).toHaveBeenCalled()
        })

        it('should add a new group with addNewGroup', () => {
            // groupList is a getter over activityForm, so it cannot be stubbed - build the
            // form the way ngOnInit does and assert the array actually grows.
            component.ngOnInit()
            jest.spyOn(component, 'setGroupValues')
            const before = component.groupList.length

            // Call addNewGroup
            component.addNewGroup()

            // Verify group was added
            expect(component.groupList.length).toBe(before + 1)
            expect(component.setGroupValues).toHaveBeenCalled()
        })

        it('should add a new group activity with addNewGroupActivity', () => {
            // groupcompetencyList reads through activityForm -> groupsArray -> the active
            // group, so the form has to be built and hold a group first. Driving the real
            // form rather than a stub also covers setGroupActivityValues, which patches it.
            component.ngOnInit()
            component.addNewGroup()
            component.activeGroupIdx = 0

            // addNewGroup seeds one default competency row, so the new one lands after it.
            const before = component.groupcompetencyList.length

            component.addNewGroupActivity(0)

            expect(component.groupcompetencyList.length).toBe(before + 1)
            expect(component.groupcompetencyList.at(before).get('localId')!.value).toBe('mock-id')
        })
    })

    describe('Event Handlers', () => {
        beforeEach(() => {
            // Create form for testing event handlers
            component.createForm()
        })

        it('should update activeGroupIdx when enter is called', () => {
            // Call enter with index 2
            component.enter(2)

            // Verify activeGroupIdx was updated
            expect(component.activeGroupIdx).toBe(2)
        })

        it('should filter users when filterUsers is called', async () => {
            // Call filterUsers
            await component.filterUsers('test')

            // Verify onSearchUser was called
            expect(mockAllocateService.onSearchUser).toHaveBeenCalledWith('test')
        })

        it('should filter competencies when filterCompetencies is called', async () => {
            // Setup spy
            const nextSpy = jest.spyOn(component.filteredCompetenciesV1, 'next')

            // Call filterCompetencies with search term longer than 2 chars
            await component.filterCompetencies('test', 1)

            // Verify
            expect(component.selectedCompIdx).toBe(1)
            expect(mockAllocateService.onSearchCompetency).toHaveBeenCalledWith('test')
            expect(nextSpy).toHaveBeenCalled()
        })

        it('should not filter competencies when search term is too short', async () => {
            // Call filterCompetencies with short search term
            await component.filterCompetencies('te', 1)

            // Verify onSearchCompetency was not called
            expect(mockAllocateService.onSearchCompetency).not.toHaveBeenCalled()
        })
    })

    describe('Drag and Drop Functionality', () => {
        it('should handle dropping within the same container', () => {
            // groupcompetencyList reads through activityForm -> groupsArray -> the active
            // group, so the form has to be built and hold a group first.
            component.ngOnInit()
            component.addNewGroup()
            // Setup mock event
            // dropgroup distinguishes the two cases by object identity, not by container
            // id, so "same container" means literally the same object on both sides.
            const sameContainer = {
                id: 'compe_0',
                data: [{ id: 1 }, { id: 2 }, { id: 3 }]
            }
            const mockEvent = {
                previousContainer: sameContainer,
                container: sameContainer,
                previousIndex: 1,
                currentIndex: 2,
                item: { data: { compName: 'Test' } }
            }

            // Setup mock group competency list
            const mockControls = [{ value: 1 }, { value: 2 }, { value: 3 }]
            const mockGroupList = {
                controls: mockControls,
                value: [1, 2, 3]
            }
            jest.spyOn(component, 'groupcompetencyList', 'get').mockReturnValue(mockGroupList as any)

            // Mock moveItemInArray function globally
            //global.moveItemInArray = jest.fn()

            // Call dropgroup
            component.dropgroup(mockEvent as any)

            // Verify moveItemInArray was called twice (once for controls, once for values)
            //expect(global.moveItemInArray).toHaveBeenCalledTimes(2)

            // Verify watStore.setgetcompetencyGroup was called
            expect(mockWatStore.setgetcompetencyGroup).toHaveBeenCalled()
        })
    })

    describe('Competency Selection and Updates', () => {
        it('should open dialog when competency is selected', () => {
            // groupcompetencyList reads through activityForm -> groupsArray -> the active
            // group, so the form has to be built and hold a group first.
            component.ngOnInit()
            component.addNewGroup()
            // Setup
            const mockEvent = {
                option: {
                    value: {
                        name: 'Competency 1',
                        id: 'comp-1',
                        description: 'Description',
                        children: []
                    }
                }
            }

            // Setup groupList
            // component.groupList = {
            //     at: jest.fn().mockReturnValue({
            //         get: jest.fn().mockReturnValue({
            //             at: jest.fn().mockReturnValue({
            //                 get: jest.fn().mockReturnValue({
            //                     value: 'mock-id'
            //                 }),
            //                 patchValue: jest.fn()
            //             }),
            //             value: [{ localId: 'mock-id', compName: 'Test' }]
            //         })
            //     })
            // } as any

            // Call competencySelected
            component.competencySelected(mockEvent, 0)

            // Verify dialog was opened
            expect(mockDialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                restoreFocus: false,
                disableClose: true,
                data: expect.any(Object)
            }))
        })

        it('should update form values when dialog is closed with OK', () => {
            // groupcompetencyList reads through activityForm -> groupsArray -> the active
            // group, so the form has to be built and hold a group with one competency row.
            component.ngOnInit()
            component.addNewGroup()
            component.activeGroupIdx = 0
            component.addNewGroupActivity(0)
            component.selectedCompIdx = 0

            const mockEvent = {
                option: {
                    value: {
                        name: 'Competency 1',
                        id: 'comp-1',
                        description: 'Description',
                        children: []
                    }
                }
            }

            // Call competencySelected. mockDialogRef closes with { ok: true, data } straight
            // away, so the patches below have already been applied when it returns.
            component.competencySelected(mockEvent, 0)

            // Verify the competency row carries what the dialog returned.
            const row = component.groupcompetencyList.at(0)
            expect(row.get('compId')!.value).toBe('comp-1')
            expect(row.get('compName')!.value).toBe('Competency 1')
            expect(row.get('compDescription')!.value).toBe('Description')
            expect(row.get('compLevel')!.value).toBe('Level 1')
            expect(row.get('compType')!.value).toBe('Type 1')
            expect(row.get('compArea')!.value).toBe('Area 1')
            expect(row.get('compSource')!.value).toBe('Source 1')
            expect(mockWatStore.setgetcompetencyGroup).toHaveBeenCalled()
        })
    })

    describe('Delete Operations', () => {
        it('should delete competency when confirmed', () => {
            // Setup mocks
            jest.spyOn(component, 'deleteRowCompetency').mockImplementation(() => { })
            mockDialogRef.afterClosed = jest.fn().mockReturnValue(of(true))

            // Call deleteSingleCompetency
            component.deleteSingleCompetency(0, 0)

            // Verify dialog was opened
            expect(mockDialog.open).toHaveBeenCalled()

            // Verify deleteRowCompetency was called and snackbar was shown
            expect(component.deleteRowCompetency).toHaveBeenCalledWith(0, 0)
            expect(mockSnackBar.open).toHaveBeenCalled()
        })

        it('should not delete competency when canceled', () => {
            // Setup mocks
            jest.spyOn(component, 'deleteRowCompetency').mockImplementation(() => { })
            mockDialogRef.afterClosed = jest.fn().mockReturnValue(of(false))

            // Call deleteSingleCompetency
            component.deleteSingleCompetency(0, 0)

            // Verify dialog was opened
            expect(mockDialog.open).toHaveBeenCalled()

            // Verify deleteRowCompetency was not called
            expect(component.deleteRowCompetency).not.toHaveBeenCalled()
            expect(mockSnackBar.open).not.toHaveBeenCalled()
        })

        it('should remove competency at specified index with deleteRowCompetency', () => {
            // groupcompetencyList reads through activityForm -> groupsArray -> the active
            // group, so the form has to be built and hold a group with two rows to delete
            // the second one.
            component.ngOnInit()
            component.addNewGroup()
            component.activeGroupIdx = 0
            // addNewGroup seeds one default row; this adds the second, which is the one
            // deleteRowCompetency is asked to remove.
            component.addNewGroupActivity(0)
            component.groupcompetencyList.at(1).get('compName')!.patchValue('second')
            expect(component.groupcompetencyList.length).toBe(2)

            // Call deleteRowCompetency
            component.deleteRowCompetency(0, 1)

            // Verify the second competency was removed and the store was updated
            expect(component.groupcompetencyList.length).toBe(1)
            expect(component.groupcompetencyList.at(0).get('compName')!.value).toBe('')
            expect(mockWatStore.setgetcompetencyGroup).toHaveBeenCalled()
        })
    })
})