import { CreateAssigneeComponent } from './create-assignee.component'
import { TrainingPlanDataSharingService } from './../../services/training-plan-data-share.service'

jest.mock('./../../services/training-plan-data-share.service')

describe('CreateAssigneeComponent', () => {
    let component: CreateAssigneeComponent
    let tpdsSvc: TrainingPlanDataSharingService

    beforeEach(() => {
        tpdsSvc = new TrainingPlanDataSharingService()
        component = new CreateAssigneeComponent(tpdsSvc)
        tpdsSvc.trainingPlanAssigneeData = { category: 'Designation', data: [] }
        tpdsSvc.trainingPlanStepperData = {}
        tpdsSvc.trainingPlanAssigneeData.data = [
            { name: 'John Doe', selected: false },
            { name: 'Jane Doe', selected: false }
        ]
    })

    it('should initialize categoryData correctly', () => {
        component.ngOnInit()
        expect(component.categoryData.length).toBe(3)
        expect(component.categoryData[0].name).toBe('Designation')
        expect(component.categoryData[1].name).toBe('All User')
        expect(component.categoryData[2].name).toBe('Custom User')
    })

    it('should handleApiData with valid data for Designation category', () => {
        tpdsSvc.trainingPlanAssigneeData.category = 'Designation'
        tpdsSvc.trainingPlanStepperData.assignmentTypeInfo = ['John Doe']

        component.handleApiData(true)

        // Check if the selection is made correctly
        expect(tpdsSvc.trainingPlanAssigneeData.data[0].selected).toBe(true)
        expect(tpdsSvc.trainingPlanAssigneeData.data[1].selected).toBe(false)
        expect(tpdsSvc.trainingPlanStepperData.assignmentTypeInfo).toContain('John Doe')
    })

    it('should handleApiData with invalid data', () => {
        // addAssigneeInvalid is a real EventEmitter, so spy on it the way the sibling
        // tests do rather than asserting on the bare emit function.
        const emitSpy = jest.spyOn(component.addAssigneeInvalid, 'emit')
        tpdsSvc.trainingPlanAssigneeData.category = 'AllUser'
        component.handleApiData(false)

        expect(emitSpy).toHaveBeenCalledWith(false)
    })

    it('should handleSelectedChips with selected items', () => {
        tpdsSvc.trainingPlanAssigneeData.category = 'Designation'
        tpdsSvc.trainingPlanAssigneeData.data = [
            { name: 'John Doe', selected: true },
            { name: 'Jane Doe', selected: false }
        ]

        const emitSpy = jest.spyOn(component.addAssigneeInvalid, 'emit')
        component.handleSelectedChips(true)

        expect(component.selectAssigneeCount).toBe(1)
        expect(emitSpy).toHaveBeenCalledWith(false)
    })

    it('should handleSelectedChips with no selected items', () => {
        tpdsSvc.trainingPlanAssigneeData.category = 'Designation'
        tpdsSvc.trainingPlanAssigneeData.data = [
            { name: 'John Doe', selected: false },
            { name: 'Jane Doe', selected: false }
        ]

        const emitSpy = jest.spyOn(component.addAssigneeInvalid, 'emit')
        component.handleSelectedChips(true)

        expect(component.selectAssigneeCount).toBe(0)
        expect(emitSpy).toHaveBeenCalledWith(true)
    })

    it('should emit changeTabToTimeline when changeTab is called', () => {
        const emitSpy = jest.spyOn(component.changeTabToTimeline, 'emit')
        component.changeTab()
        expect(emitSpy).toHaveBeenCalledWith(false)
    })

    it('should handle itemsRemovedFromChip correctly', () => {
        const handleSelectedChipsSpy = jest.spyOn(component, 'handleSelectedChips')
        component.itemsRemovedFromChip()
        expect(handleSelectedChipsSpy).toHaveBeenCalledWith(true)
    })

    it('should handleApiData for CustomUser category and update selected data', () => {
        tpdsSvc.trainingPlanAssigneeData.category = 'CustomUser'
        tpdsSvc.trainingPlanStepperData.assignmentTypeInfo = ['user123']

        tpdsSvc.trainingPlanAssigneeData.data = [
            { userId: 'user123', selected: false },
            { userId: 'user456', selected: false }
        ]

        component.handleApiData(true)

        expect(tpdsSvc.trainingPlanAssigneeData.data[0].selected).toBe(true)
        expect(tpdsSvc.trainingPlanStepperData.assignmentTypeInfo).toContain('user123')
    })

})
