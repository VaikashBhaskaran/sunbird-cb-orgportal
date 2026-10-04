import { CategoryDropDownComponent } from './category-drop-down.component'
import { MatDialog } from '@angular/material/dialog'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { BehaviorSubject, Subject, of } from 'rxjs'

// Create a mock for MatDialog
const mockMatDialog = {
    open: jest.fn(() => ({
        afterClosed: jest.fn(() => of('cancel')),
    })),
}

describe('CategoryDropDownComponent', () => {
    let component: CategoryDropDownComponent
    let mockTrainingPlanDataSharingService: TrainingPlanDataSharingService

    beforeEach(() => {
        // Mock instance of the service
        // mockTrainingPlanDataSharingService = {
        // trainingPlanCategoryChangeEvent is a Subject on the real service, and the test
        // below subscribes to it after the component has, so seed it with a value.
        const categoryChange = new BehaviorSubject<any>({ event: 'Course' })
        mockTrainingPlanDataSharingService = {
            trainingPlanCategoryChangeEvent: categoryChange,
            // showDialogBox reads contentList.length off this without guarding; the dialog
            // is what it opens when the plan already holds content.
            trainingPlanStepperData: { contentList: ['content-1'] },
            trainingPlanContentData: { data: [] },
            trainingPlanAssigneeData: { data: [] },
            // A Subject, so the component's own emissions come back through it.
            moderatedCourseSelectStatus: new Subject(),
            // A partial double: the component only touches the members above.
        } as any

        // Create the component instance
        component = new CategoryDropDownComponent(mockMatDialog as unknown as MatDialog, mockTrainingPlanDataSharingService)
    })

    describe('ngOnInit', () => {
        it('should initialize and subscribe to the trainingPlanCategoryChangeEvent', () => {
            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.ngOnInit()

            // Manually trigger the subscription logic
            mockTrainingPlanDataSharingService.trainingPlanCategoryChangeEvent.subscribe((data: any) => {
                expect(data.event).toBe('Course')
                expect(emitSpy).toHaveBeenCalledWith('Course')
            })
        })
    })

    describe('ngOnChanges', () => {
        it('should call checkForContent when changes are detected', () => {
            const checkForContentSpy = jest.spyOn(component, 'checkForContent')
            component.ngOnChanges()
            expect(checkForContentSpy).toHaveBeenCalled()
        })
    })

    describe('checkForContent', () => {
        it('should set selectedValue and emit event if "from" is "content"', () => {
            component.from = 'content'
            mockTrainingPlanDataSharingService.trainingPlanStepperData = { contentType: 'Course' }

            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.checkForContent()

            expect(component.selectedValue).toBe('Course')
            expect(emitSpy).toHaveBeenCalledWith('Course')
        })

        it('should set default content type if none exists', () => {
            component.from = 'content'
            mockTrainingPlanDataSharingService.trainingPlanStepperData = {}

            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.checkForContent()

            expect(component.selectedValue).toBe('Course')
            expect(emitSpy).toHaveBeenCalledWith('Course')
        })

        it('should handle "assignee" case', () => {
            component.from = 'assignee'
            mockTrainingPlanDataSharingService.trainingPlanStepperData = { assignmentType: 'Designation' }

            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')
            component.checkForContent()

            expect(component.selectedValue).toBe('Designation')
            expect(emitSpy).toHaveBeenCalledWith('Designation')
        })
    })

    describe('showDialogBox', () => {
        // The two branches are exclusive: with content on the plan the change is
        // confirmed in a dialog, without it the category change goes straight through.
        it('should open the dialog box when the plan already holds content', () => {
            const openSpy = jest.spyOn(mockMatDialog, 'open')
            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')

            component.showDialogBox('Course')

            // Verify dialog was opened with correct parameters
            expect(openSpy).toHaveBeenCalledWith(expect.anything(), {
                data: expect.objectContaining({
                    event: 'Course',
                    title: expect.any(String),
                    subTitle: expect.any(String),
                }),
                autoFocus: false,
            })
            expect(emitSpy).not.toHaveBeenCalled()
        })

        it('should emit the category straight away when the plan is empty', () => {
            mockTrainingPlanDataSharingService.trainingPlanStepperData.contentList = []
            // mockMatDialog is shared across tests, so its call history has to be cleared.
            const openSpy = jest.spyOn(mockMatDialog, 'open')
            openSpy.mockClear()
            const emitSpy = jest.spyOn(component.handleCategorySelection, 'emit')

            component.showDialogBox('Course')

            expect(emitSpy).toHaveBeenCalledWith('Course')
            expect(openSpy).not.toHaveBeenCalled()
        })

        it('should call openDialoagBox when contentList is not empty', () => {
            mockTrainingPlanDataSharingService.trainingPlanStepperData.contentList = ['item']

            const openDialoagBoxSpy = jest.spyOn(component, 'openDialoagBox')
            component.showDialogBox('Course')

            expect(openDialoagBoxSpy).toHaveBeenCalled()
        })
    })

    describe('openDialoagBox', () => {
        it('should open the dialog with correct data', () => {
            const dialogData = {
                type: 'normal',
                icon: 'radio_on',
                title: 'Title',
                subTitle: 'Subtitle',
                primaryAction: 'Confirm',
                secondaryAction: 'Cancel',
                event: 'Course',
            }
            const openSpy = jest.spyOn(mockMatDialog, 'open')

            component.openDialoagBox(dialogData)

            expect(openSpy).toHaveBeenCalledWith(expect.anything(), {
                data: dialogData,
                autoFocus: false,
            })
        })
    })

    describe('hideConfirmationBox', () => {
        it('should close the dialog', () => {
            component.dialogRef = { close: jest.fn() }
            component.hideConfirmationBox()
            expect(component.dialogRef.close).toHaveBeenCalled()
        })
    })
})
