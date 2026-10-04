import { ChipComponent } from './chip.component'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { MatDialog } from '@angular/material/dialog'
import { PreviewDialogBoxComponent } from '../preview-dialog-box/preview-dialog-box.component'
import { of } from 'rxjs'

describe('ChipComponent', () => {
    let component: ChipComponent
    let mockTrainingPlanDataSharingService: jest.Mocked<TrainingPlanDataSharingService>
    let mockMatDialog: jest.Mocked<MatDialog>
    let mockDialogRef: any

    beforeEach(() => {
        // Create mock for TrainingPlanDataSharingService
        mockTrainingPlanDataSharingService = {
            trainingPlanContentData: {
                data: {
                    content: []
                }
            },
            trainingPlanStepperData: {
                contentList: [],
                assignmentTypeInfo: []
            },
            trainingPlanAssigneeData: {
                category: '',
                data: []
            },
            // Mirrors the real service: drop the identifier from the selection.
            removeSelectedContent: jest.fn(),
            // Mirrors the real service: drop the identifier from the plan's contentList.
            removeContentFromPlan: jest.fn((identifier: string) => {
                const list = mockTrainingPlanDataSharingService.trainingPlanStepperData['contentList'] || []
                const index = list.findIndex((item: any) =>
                    (typeof item === 'string' ? item : item && item.identifier) === identifier)
                if (index > -1) {
                    list.splice(index, 1)
                }
            })
        } as unknown as jest.Mocked<TrainingPlanDataSharingService>

        // Create mock for MatDialog
        mockDialogRef = {
            afterClosed: jest.fn().mockReturnValue(of({}))
        }
        mockMatDialog = {
            open: jest.fn().mockReturnValue(mockDialogRef)
        } as unknown as jest.Mocked<MatDialog>

        // Instantiate component with mocks
        component = new ChipComponent(
            mockTrainingPlanDataSharingService,
            mockMatDialog
        )

        // Setup default input properties
        component.selectedContentChips = []
        component.selectContentCount = 0
        component.from = ''
        component.selectedAssigneeChips = []
        component.selectAssigneeCount = 0
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnChanges', () => {
        it('should leave the content chips in the order of the plan', () => {
            // The content chips are given already filtered and ordered by the plan, reordering
            // them here would drop them out of that order
            component.selectedContentChips = [
                { identifier: 'do_1', name: 'First' },
                { identifier: 'do_2', name: 'Second' },
                { identifier: 'do_3', name: 'Third' }
            ]

            component.ngOnChanges()

            expect(component.selectedContentChips.map((item: any) => item.identifier))
                .toEqual(['do_1', 'do_2', 'do_3'])
        })

        it('should reorder selected assignee chips to the beginning of the array', () => {
            // Arrange
            component.selectedAssigneeChips = [
                { id: 1, selected: false },
                { id: 2, selected: true },
                { id: 3, selected: false }
            ]

            // Act
            component.ngOnChanges()

            // Assert
            // The reorder only moves the picked chip to the front; nothing is dropped.
            expect(component.selectedAssigneeChips[0].id).toBe(2)
            expect(component.selectedAssigneeChips.length).toBe(3)
        })
    })

    describe('clearAll', () => {
        it('should clear all content selections when from is "content"', () => {
            // Arrange
            component.from = 'content'
            component.selectContentCount = 5
            mockTrainingPlanDataSharingService.trainingPlanContentData.data.content = [
                { identifier: '1', selected: true },
                { identifier: '2', selected: true }
            ]
            mockTrainingPlanDataSharingService.trainingPlanStepperData.contentList = ['1', '2']
            const emitSpy = jest.spyOn(component.itemRemoved, 'emit')

            // Act
            component.clearAll()

            // Assert
            expect(component.selectContentCount).toBe(0)
            expect(mockTrainingPlanDataSharingService.trainingPlanContentData.data.content[0].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanContentData.data.content[1].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanStepperData.contentList).toEqual([])
            expect(emitSpy).toHaveBeenCalledWith(true)
        })

        it('should clear all assignee selections when from is "assignee" and category is "Designation"', () => {
            // Arrange
            component.from = 'assignee'
            component.selectAssigneeCount = 3
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.category = 'Designation'
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data = [
                { name: 'Dev', selected: true },
                { name: 'QA', selected: true }
            ]
            mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo = ['Dev', 'QA']
            const emitSpy = jest.spyOn(component.itemRemoved, 'emit')

            // Act
            component.clearAll()

            // Assert
            expect(component.selectAssigneeCount).toBe(0)
            expect(mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data[0].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data[1].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo).toEqual([])
            expect(emitSpy).toHaveBeenCalledWith(true)
        })

        it('should clear all assignee selections when from is "assignee" and category is "CustomUser"', () => {
            // Arrange
            component.from = 'assignee'
            component.selectAssigneeCount = 3
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.category = 'CustomUser'
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data = [
                { userId: 'user1', selected: true },
                { userId: 'user2', selected: true }
            ]
            mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo = ['user1', 'user2']
            const emitSpy = jest.spyOn(component.itemRemoved, 'emit')

            // Act
            component.clearAll()

            // Assert
            expect(component.selectAssigneeCount).toBe(0)
            expect(mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data[0].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data[1].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo).toEqual([])
            expect(emitSpy).toHaveBeenCalledWith(true)
        })
    })

    describe('removeContent', () => {
        it('should remove the specified content item', () => {
            // Arrange
            component.selectContentCount = 2
            const contentItem = { identifier: '1', selected: true }
            mockTrainingPlanDataSharingService.trainingPlanContentData.data.content = [
                contentItem,
                { identifier: '2', selected: true }
            ]
            mockTrainingPlanDataSharingService.trainingPlanStepperData.contentList = ['1', '2']
            const emitSpy = jest.spyOn(component.itemRemoved, 'emit')

            // Act
            component.removeContent(contentItem)

            // Assert
            expect(component.selectContentCount).toBe(1)
            expect(mockTrainingPlanDataSharingService.trainingPlanContentData.data.content[0].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanStepperData.contentList).toEqual(['2'])
            expect(emitSpy).toHaveBeenCalledWith(true)
        })
    })

    describe('removeAssignee', () => {
        it('should remove the specified assignee item when category is "Designation"', () => {
            // Arrange
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.category = 'Designation'
            const assigneeItem = { name: 'Dev', selected: true }
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data = [
                assigneeItem,
                { name: 'QA', selected: true }
            ]
            mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo = ['Dev', 'QA']
            const emitSpy = jest.spyOn(component.itemRemoved, 'emit')

            // Act
            component.removeAssignee(assigneeItem)

            // Assert
            expect(mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data[0].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo).toEqual(['QA'])
            expect(emitSpy).toHaveBeenCalledWith(true)
        })

        it('should remove the specified assignee item when category is "CustomUser"', () => {
            // Arrange
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.category = 'CustomUser'
            const assigneeItem = { userId: 'user1', selected: true }
            mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data = [
                assigneeItem,
                { userId: 'user2', selected: true }
            ]
            mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo = ['user1', 'user2']
            const emitSpy = jest.spyOn(component.itemRemoved, 'emit')

            // Act
            component.removeAssignee(assigneeItem)

            // Assert
            expect(mockTrainingPlanDataSharingService.trainingPlanAssigneeData.data[0].selected).toBe(false)
            expect(mockTrainingPlanDataSharingService.trainingPlanStepperData.assignmentTypeInfo).toEqual(['user2'])
            expect(emitSpy).toHaveBeenCalledWith(true)
        })
    })

    describe('navigateToPreviewPage', () => {
        it('should open the preview dialog and emit event when dialog is closed', () => {
            // Arrange
            component.from = 'content'
            const emitSpy = jest.spyOn(component.itemRemoved, 'emit')

            // Act
            component.navigateToPreviewPage()

            // Assert
            expect(mockMatDialog.open).toHaveBeenCalledWith(
                PreviewDialogBoxComponent,
                {
                    disableClose: true,
                    data: { from: 'content' },
                    autoFocus: false,
                    width: '90%'
                }
            )

            // Trigger the afterClosed callback
            mockDialogRef.afterClosed().subscribe(() => {
                expect(emitSpy).toHaveBeenCalledWith(true)
            })
        })
    })
})