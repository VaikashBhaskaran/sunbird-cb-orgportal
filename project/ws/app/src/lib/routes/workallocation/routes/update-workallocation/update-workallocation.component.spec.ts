import { UpdateWorkallocationComponent } from './update-workallocation.component'
import { UntypedFormBuilder } from '@angular/forms'
import { of } from 'rxjs'
import * as _ from 'lodash'

describe('UpdateWorkallocationComponent', () => {
    let component: UpdateWorkallocationComponent
    let mockExportAsService: any
    let mockSnackBar: any
    let mockRouter: any
    let mockFormBuilder: UntypedFormBuilder
    let mockAllocationService: any
    let mockActivatedRoute: any
    let mockConfigService: any
    let mockEventService: any
    let mockElementRef: any

    beforeEach(() => {

        // displayLoader() and toggleDisplay() reach for elements by id with a non-null

        // assertion; jsdom has no such nodes unless the test creates them.

        ;['loader', 'positions', 'roles', 'activities'].forEach(id => {

            if (!document.getElementById(id)) {

                const el = document.createElement('div')

                el.id = id

                document.body.appendChild(el)

            }

        })

        // Mock services
        mockExportAsService = {
            save: jest.fn().mockReturnValue(of({})),
            get: jest.fn().mockReturnValue(of({}))
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockFormBuilder = new UntypedFormBuilder()

        mockAllocationService = {
            getUsers: jest.fn().mockReturnValue(of({
                result: {
                    data: [
                        {
                            allocationDetails: {
                                id: '123',
                                userId: '123',
                                userName: 'Test User',
                                userEmail: 'test@example.com',
                                userPosition: 'Test Position',
                                activeList: [{ name: 'Role 1', childNodes: ['Activity 1'] }],
                                archivedList: []
                            },
                            userDetails: {
                                wid: '123'
                            }
                        }
                    ]
                }
            })),
            onSearchPosition: jest.fn().mockReturnValue(of({ responseData: [{ name: 'Test Position', id: '1' }] })),
            onSearchRole: jest.fn().mockReturnValue(of([{ name: 'Test Role', childNodes: [{ name: 'Activity 1' }] }])),
            onSearchActivity: jest.fn().mockReturnValue(of({ responseData: [{ name: 'Test Activity' }] })),
            updateAllocation: jest.fn().mockReturnValue(of({ responseCode: 'OK' }))
        }

        mockActivatedRoute = {
            snapshot: {
                params: {
                    userId: '123'
                }
            }
        }

        mockConfigService = {
            unMappedUser: {
                channel: 'Test Department',
                rootOrgId: 'dept123'
            }
        }

        mockEventService = {
            raiseInteractTelemetry: jest.fn()
        }

        mockElementRef = {
            nativeElement: {
                value: ''
            }
        }

        // Create component instance
        component = new UpdateWorkallocationComponent(
            mockExportAsService,
            mockSnackBar,
            mockRouter,
            mockFormBuilder,
            mockAllocationService,
            mockActivatedRoute,
            mockConfigService,
            mockEventService
        )

        // Mock DOM elements
        document.body.innerHTML = `
      <div id="loader" style="display:none;"></div>
      <div id="showremove0"></div>
    `

        // Set the ElementRef
        component.inputvar = mockElementRef
    })

    it('should create the component', () => {
        expect(component).toBeDefined()
    })

    it('should initialize tabs data on ngOnInit', () => {
        component.ngOnInit()
        expect(component.tabsData.length).toBe(3)
        expect(component.tabsData[0].name).toBe('Officer')
        expect(component.tabsData[1].name).toBe('Roles and activities')
        expect(component.tabsData[2].name).toBe('Archived')
    })

    it('should get department users on initialization', () => {
        component.getdeptUsers()
        expect(component.departmentName).toBe('Test Department')
        expect(component.departmentID).toBe('dept123')
        expect(mockAllocationService.getUsers).toHaveBeenCalled()
    })

    it('should fetch and set user details', () => {
        // ngOnInit already ran one fetch, and getAllUsers appends rather than replaces, so
        // start from a clean list to measure this call on its own.
        component.data = []

        component.getAllUsers()
        expect(mockAllocationService.getUsers).toHaveBeenCalled()
        expect(component.selectedUser).toBeDefined()
        expect(component.data.length).toBe(1)
        expect(component.ralist.length).toBeGreaterThan(0)
    })

    it('should export data as PDF', () => {
        component.export()
        expect(mockExportAsService.save).toHaveBeenCalled()
        expect(component.displaytemplate).toBe(false)
    })

    it('should handle side nav tab click', () => {
        const spy = jest.spyOn(document, 'getElementById').mockReturnValue({
            scrollIntoView: jest.fn()
        } as unknown as HTMLElement)

        component.ngOnInit()
        component.onSideNavTabClick('roles')

        expect(component.currentTab).toBe('roles')
        expect(spy).toHaveBeenCalledWith('roles')
        expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()

        // Restore immediately: leaving this spy in place makes every later test receive a
        // stub element with no .style, which breaks displayLoader/toggleDisplay.
        spy.mockRestore()
    })

    it('should set role in form array', () => {
        // const spy = jest.spyOn(component.newAllocationForm.controls.rolelist, 'push')
        // component.setRole()
        // expect(spy).toHaveBeenCalled()
    })

    it('should search for positions', () => {
        const event = { target: { value: 'Test' } }
        component.onSearchPosition(event)
        expect(mockAllocationService.onSearchPosition).toHaveBeenCalled()
        expect(component.similarPositions.length).toBeGreaterThan(0)
        expect(component.nosimilarPositions).toBe(false)
    })

    it('should search for roles', () => {
        const event = { target: { value: 'Test' } }
        component.onSearchRole(event)
        expect(mockAllocationService.onSearchRole).toHaveBeenCalled()
        expect(component.similarRoles.length).toBeGreaterThan(0)
        expect(component.nosimilarRoles).toBe(false)
    })

    it('should search for activities', () => {
        const event = { target: { value: 'Test' } }
        component.onSearchActivity(event)
        expect(mockAllocationService.onSearchActivity).toHaveBeenCalled()
        expect(component.similarActivities.length).toBeGreaterThan(0)
        expect(component.nosimilarActivities).toBe(false)
    })

    it('should set all "no similar" flags to false', () => {
        component.nosimilarRoles = true
        component.nosimilarPositions = true
        component.nosimilarActivities = true

        component.setAllMsgFalse()

        expect(component.nosimilarRoles).toBe(false)
        expect(component.nosimilarPositions).toBe(false)
        expect(component.nosimilarActivities).toBe(false)
    })

    it('should display and hide loader', () => {
        component.displayLoader('true')
        const loader = document.getElementById('loader')
        expect(loader?.style.display).toBe('block')

        component.displayLoader('false')
        expect(loader?.style.display).toBe('none')
    })

    it('should select a role', () => {
        const role = {
            name: 'Test Role',
            childNodes: [{ name: 'Activity 1' }]
        }

        component.selectRole(role)

        expect(component.selectedRole).toEqual(role)
        // selectRole keeps the activity objects for the list but flattens the role's own
        // childNodes down to names before patching it into the form, so these differ.
        expect(component.activitieslist).toEqual([{ name: 'Activity 1' }])
        expect(role.childNodes).toEqual(['Activity 1'])
        expect(component.similarRoles).toEqual([])
        expect(mockElementRef.nativeElement.value).toBe('')
    })

    it('should select an activity', () => {
        const activity = { name: 'Test Activity' }
        component.activitieslist = []

        component.selectActivity(activity)

        expect(component.similarActivities).toEqual([])
        expect(mockElementRef.nativeElement.value).toBe('')
        expect(component.activitieslist).toContain(activity)
    })

    it('should select a position', () => {
        const position = { name: 'Test Position', id: '1' }

        component.selectPosition(position)

        expect(component.selectedPosition).toEqual(position)
        expect(component.similarPositions).toEqual([])
        expect(component.newAllocationForm.value.position).toBe('Test Position')
    })

    it('should add roles and activities when valid', () => {
        component.selectedRole = {
            name: 'Test Role',
            childNodes: [{ name: 'Activity 1' }]
        }
        component.activitieslist = [{ name: 'Activity 1' }]

        component.addRolesActivity(0)

        expect(component.showRAerror).toBe(false)
        expect(component.ralist.length).toBeGreaterThan(0)
        expect(component.activitieslist).toEqual([])
    })

    it('should show error when trying to add roles without activities', () => {
        component.selectedRole = { name: 'Test Role', childNodes: [] }
        component.activitieslist = []

        component.addRolesActivity(0)

        expect(component.showRAerror).toBe(true)
    })

    it('should add a new activity', () => {
        component.activitieslist = []
        component.newAllocationForm.value.rolelist = [{ childNodes: 'New Activity' }]

        component.addActivity()

        expect(component.activitieslist.length).toBe(1)
        expect(component.activitieslist[0].name).toBe('New Activity')
    })

    it('should remove an activity', () => {
        component.activitieslist = [
            { name: 'Activity 1' },
            { name: 'Activity 2' }
        ]

        component.removeActivity(0)

        expect(component.activitieslist.length).toBe(1)
        expect(component.activitieslist[0].name).toBe('Activity 2')
    })

    it('should delete a role', () => {
        component.ralist = [
            { name: 'Role 1' },
            { name: 'Role 2' }
        ]

        component.buttonClick('Delete', component.ralist[0])

        expect(component.ralist.length).toBe(1)
        expect(component.ralist[0].name).toBe('Role 2')
    })

    it('should archive a role', () => {
        component.ralist = [
            { name: 'Role 1' },
            { name: 'Role 2' }
        ]
        component.archivedlist = []

        component.buttonClick('Archive', component.ralist[0])

        expect(component.ralist.length).toBe(1)
        expect(component.ralist[0].name).toBe('Role 2')
        expect(component.archivedlist.length).toBe(1)
        expect(component.archivedlist[0].name).toBe('Role 1')
        expect(component.archivedlist[0].isArchived).toBe(true)
    })

    it('should submit the form and update allocation', () => {
        component.selectedUser = {
            allocationDetails: {
                id: '123',
                userId: '123',
                userPosition: 'Test Position'
            }
        }
        component.orgselectedUser = component.selectedUser
        component.ralist = [{ name: 'Role 1' }]
        component.archivedlist = []
        component.departmentID = 'dept123'
        component.departmentName = 'Test Department'

        component.onSubmit()

        expect(mockAllocationService.updateAllocation).toHaveBeenCalled()
        expect(mockSnackBar.open).toHaveBeenCalledWith('Work Allocation updated Successfully', 'X', { duration: 5000 })
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/workallocation'])
    })
})