import { CreateTimelineComponent } from './create-timeline.component'
import { PreviewDialogBoxComponent } from '../../components/preview-dialog-box/preview-dialog-box.component'

describe('CreateTimelineComponent', () => {
    let component: CreateTimelineComponent
    let tpdsSvcMock: any
    let dialogMock: any

    beforeEach(() => {
        // Mock the TrainingPlanDataSharingService
        tpdsSvcMock = {
            // Mirrors the real service: the ids held on the plan, in plan order.
            getContentIdentifiers: jest.fn(() =>
                ((tpdsSvcMock.trainingPlanStepperData || {}).contentList || [])
                    .map((item: any) => (typeof item === 'string' ? item : item && item.identifier))
                    .filter((id: any) => !!id)),
            trainingPlanStepperData: {
                status: 'live',
                assignmentType: 'Designation',
                contentList: ['do_1', 'do_2', 'do_3', 'do_4', 'do_5'],
            },
            // The whole selection of the plan, whichever page each content was picked from
            trainingPlanSelectedContent: [
                { identifier: 'do_1', selected: true },
                { identifier: 'do_2', selected: true },
                { identifier: 'do_3', selected: true },
                { identifier: 'do_4', selected: true },
                { identifier: 'do_5', selected: true },
            ],
            trainingPlanAssigneeData: {
                category: 'Designation',
                data: [
                    { selected: true },
                    { selected: false },
                    { selected: true },
                    { selected: true },
                ],
            },
        }

        // Mock MatDialog
        dialogMock = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue({
                    subscribe: jest.fn(),
                }),
            }),
        }

        // Create an instance of the component
        component = new CreateTimelineComponent(tpdsSvcMock, dialogMock)
    })

    it('should initialize with content data and assignee data', () => {
        component.ngOnInit()

        expect(component.isContentLive).toBe(true)
        expect(component.contentData.length).toBe(4) // Because we slice to get 4 items
        expect(component.totalContentCount).toBe(5) // 5 content on the plan

        expect(component.assigneeData.category).toBe('Designation')
        expect(component.assigneeData.data.length).toBe(3) // 3 selected assignees
        expect(component.totalAssigneeCount).toBe(3) // 3 selected assignees
    })

    it('should show the content selected on the plan, in the order of the plan', () => {
        component.getContentData()

        // Verify content data selection
        expect(component.contentData.length).toBe(4)
        expect(component.contentData.map((item: any) => item.identifier))
            .toEqual(['do_1', 'do_2', 'do_3', 'do_4'])
        expect(component.totalContentCount).toBe(5)
    })

    it('should show the selected content without the search having been called', () => {
        // The search never ran, so there is no page of results to read the selection from
        tpdsSvcMock.trainingPlanContentData = undefined

        component.getContentData()

        expect(component.totalContentCount).toBe(5)
        expect(component.contentData.length).toBe(4)
    })

    it('should drop the content of the plan whose details could not be read', () => {
        tpdsSvcMock.trainingPlanSelectedContent = [{ identifier: 'do_2', selected: true }]

        component.getContentData()

        expect(component.totalContentCount).toBe(1)
        expect(component.contentData[0].identifier).toBe('do_2')
    })

    it('should filter assignee data correctly for Designation', () => {
        component.getDesignationData()

        expect(component.assigneeData.category).toBe('Designation')
        expect(component.assigneeData.data.length).toBe(3) // Should return 3 selected assignees
        expect(component.totalAssigneeCount).toBe(3) // 3 selected assignees
    })

    it('should open dialog when showAll is called', () => {
        component.showAll('content')

        expect(dialogMock.open).toHaveBeenCalledWith(PreviewDialogBoxComponent, {
            disableClose: true,
            data: { from: 'content' },
            autoFocus: false,
            width: '90%',
        })
    })

    it('should call getContentData when contentRemoved is called', () => {
        const getContentDataSpy = jest.spyOn(component, 'getContentData')

        component.contentRemoved()

        expect(getContentDataSpy).toHaveBeenCalled()
    })

    it('should call getDesignationData when selectedUserRemoved is called with Designation', () => {
        const getDesignationDataSpy = jest.spyOn(component, 'getDesignationData')

        component.selectedUserRemoved()

        expect(getDesignationDataSpy).toHaveBeenCalled()
    })

    it('should call getCustomUserData when selectedUserRemoved is called with CustomUser', () => {
        tpdsSvcMock.trainingPlanStepperData.assignmentType = 'CustomUser'
        const getCustomUserDataSpy = jest.spyOn(component, 'getCustomUserData')

        component.selectedUserRemoved()

        expect(getCustomUserDataSpy).toHaveBeenCalled()
    })
})
