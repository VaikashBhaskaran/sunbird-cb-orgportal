import { ActivatedRoute } from '@angular/router'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { CreatePlanComponent } from './create-plan.component'

describe('CreatePlanComponent', () => {
    let component: CreatePlanComponent

    const route: Partial<ActivatedRoute> = {}
    const tpdsSvc: Partial<TrainingPlanDataSharingService> = {
        // ngOnInit pushes each preselected content id onto the plan.
        addContentToPlan: jest.fn(),
    }

    beforeAll(() => {
        component = new CreatePlanComponent(
            route as ActivatedRoute,
            tpdsSvc as TrainingPlanDataSharingService
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should set plan title and assignee data on ngOnInit with CustomUser', () => {
        const mockContentData = {
            name: 'Test Plan',
            assignmentType: 'CustomUser',
            userDetails: [{ userId: 'u1' }, { userId: 'u2' }],
            contentList: [{ identifier: 'c1' }, { identifier: 'c2' }],
            contentType: 'Course',
            assignmentTypeInfo: 'info',
            endDate: '2025-12-31',
            status: 'Draft',
            isApar: true,
            contextData: { accessControl: { userGroups: [], version: 1 } }
        }
        const route: any = { snapshot: { data: { contentData: mockContentData } } }
        const tpdsSvc: any = {
            trainingPlanStepperData: { contentList: [] },
            filterToggle: { subscribe: jest.fn() },
            // ngOnInit pushes each preselected content id onto the plan and mirrors it into
            // the selection.
            addContentToPlan: jest.fn((identifier: string, mandatory = false) => {
                tpdsSvc.trainingPlanStepperData.contentList.push({ identifier, mandatory: !!mandatory })
            }),
            addSelectedContent: jest.fn()
        }
        const comp = new CreatePlanComponent(route, tpdsSvc)
        comp.ngOnInit()
        expect(tpdsSvc.trainingPlanTitle).toBe('Test Plan')
        expect(tpdsSvc.trainingPlanAssigneeData.data).toEqual(mockContentData.userDetails)
        // ngOnInit no longer assigns trainingPlanContentData (that line is commented out in
        // the component); it feeds each entry through addContentToPlan instead.
        expect(tpdsSvc.addContentToPlan).toHaveBeenCalledTimes(2)
        expect(tpdsSvc.trainingPlanStepperData.contentList.length).toBe(2)
        expect(tpdsSvc.trainingPlanStepperData.contentType).toBe('Course')
        expect(tpdsSvc.trainingPlanStepperData.isApar).toBe(true)
    })

    it('should set plan title and assignee data on ngOnInit with non-CustomUser', () => {
        const mockContentData = {
            name: 'Test Plan',
            assignmentType: 'Department',
            assignmentTypeInfo: 'deptInfo',
            contentList: [],
            contentType: 'Course',
            endDate: '2025-12-31',
            status: 'Draft',
            isApar: false,
            contextData: { accessControl: { userGroups: [], version: 1 } }
        }
        const route: any = { snapshot: { data: { contentData: mockContentData } } }
        const tpdsSvc: any = {
            trainingPlanStepperData: { contentList: [] },
            filterToggle: { subscribe: jest.fn() }
        }
        const comp = new CreatePlanComponent(route, tpdsSvc)
        comp.ngOnInit()
        expect(tpdsSvc.trainingPlanTitle).toBe('Test Plan')
        expect(tpdsSvc.trainingPlanAssigneeData.category).toBe('Department')
        expect(tpdsSvc.trainingPlanAssigneeData.data).toEqual(['deptInfo'])
        expect(tpdsSvc.trainingPlanStepperData.isApar).toBe(false)
    })

    describe('APAR year seeding', () => {
        const buildStepperSvc = () => ({
            trainingPlanStepperData: { contentList: [] },
            filterToggle: { subscribe: jest.fn() }
        }) as any

        const editContentData = (planYear?: string) => ({
            name: 'Test Plan',
            assignmentType: 'Department',
            assignmentTypeInfo: 'deptInfo',
            contentList: [],
            contentType: 'Course',
            endDate: '2025-12-31',
            status: 'Draft',
            isApar: true,
            planYear,
            contextData: { accessControl: { userGroups: [], version: 1 } }
        })

        it('should take the year from the plan being edited', () => {
            const route: any = { snapshot: { data: { contentData: editContentData('2025-26') } } }
            const tpdsSvc = buildStepperSvc()

            new CreatePlanComponent(route, tpdsSvc).ngOnInit()

            expect(tpdsSvc.trainingPlanStepperData.aparYear).toBe('2025-26')
        })

        it('should leave the year unset for a plan saved before planYear existed', () => {
            const route: any = { snapshot: { data: { contentData: editContentData() } } }
            const tpdsSvc = buildStepperSvc()

            new CreatePlanComponent(route, tpdsSvc).ngOnInit()

            expect(tpdsSvc.trainingPlanStepperData.aparYear).toBeUndefined()
        })

        it('should take the year the dashboard passed on the query string', () => {
            const route: any = {
                snapshot: { data: { contentData: null }, queryParams: { aparYear: '2026-27' } }
            }
            const tpdsSvc = buildStepperSvc()

            new CreatePlanComponent(route, tpdsSvc).ngOnInit()

            expect(tpdsSvc.trainingPlanStepperData.aparYear).toBe('2026-27')
        })

        it('should leave the year unset when the query string carries none', () => {
            const route: any = { snapshot: { data: { contentData: null }, queryParams: {} } }
            const tpdsSvc = buildStepperSvc()

            new CreatePlanComponent(route, tpdsSvc).ngOnInit()

            expect(tpdsSvc.trainingPlanStepperData.aparYear).toBeUndefined()
        })

        it('should survive a snapshot with no query params at all', () => {
            const route: any = { snapshot: { data: { contentData: null } } }
            const tpdsSvc = buildStepperSvc()

            expect(() => new CreatePlanComponent(route, tpdsSvc).ngOnInit()).not.toThrow()
        })
    })

    it('should update selectedTabData and nextTab on selectedTabAction', () => {
        component.selectedTabAction('tab2')
        expect(component.selectedTabData).toBe('tab2')
        expect(component.nextTab).toBe('tab2')
    })

    it('should update nextTab on changeTab', () => {
        component.changeTab('tab3')
        expect(component.nextTab).toBe('tab3')
    })

    it('should update createCheck.titleIsInvalid on isPlanTitleInvalid', () => {
        component.createCheck = {}
        component.isPlanTitleInvalid(true)
        expect(component.createCheck.titleIsInvalid).toBe(true)
    })

    it('should update createCheck.addContentIsInvalid on isAddContentInvalid', () => {
        component.createCheck = {}
        component.isAddContentInvalid(true)
        expect(component.createCheck.addContentIsInvalid).toBe(true)
    })

    it('should update createCheck.addAssigneeIsInvalid on isAddAssigneeInvalid', () => {
        component.createCheck = {}
        component.isAddAssigneeInvalid(true)
        expect(component.createCheck.addAssigneeIsInvalid).toBe(true)
    })
})