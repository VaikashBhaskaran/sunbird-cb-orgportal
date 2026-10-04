import { AllocationActionsComponent } from './allocation-actions.component'
import { AllocationService } from '../../services/allocation.service'
import { MatDialogRef } from '@angular/material/dialog'
import { UntypedFormBuilder } from '@angular/forms'
import { of } from 'rxjs'

// Mocking the AllocationService
jest.mock('../../services/allocation.service')

describe('AllocationActionsComponent', () => {
    let component: AllocationActionsComponent
    let allocationService: jest.Mocked<AllocationService>
    let dialogRef: jest.Mocked<MatDialogRef<AllocationActionsComponent>>

    beforeEach(() => {

        // displayLoader()/toggleDisplay() look elements up by id with a non-null

        // assertion; jsdom has none unless the test creates them.

        if (!document.getElementById('loader')) {

            const el = document.createElement('div')

            el.id = 'loader'

            document.body.appendChild(el)

        }

        // Mocking MatDialogRef to avoid TypeError
        dialogRef = {
            close: jest.fn(),
        } as unknown as jest.Mocked<MatDialogRef<AllocationActionsComponent>>

        // Setup mocks for the service
        allocationService = new AllocationService(null as any) as jest.Mocked<AllocationService>

        // Instantiate the component with mocked dependencies
        component = new AllocationActionsComponent(
            allocationService,
            new UntypedFormBuilder(),
            dialogRef,
            { userData: { userDetails: { wid: '1', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' } } }
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize formdata correctly', () => {
        expect(component.formdata.fname).toBe('')
        expect(component.formdata.email).toBe('')
        expect(component.formdata.position).toBe('')
    })

    it('should close the dialog', () => {
        component.close()
        expect(dialogRef.close).toHaveBeenCalled()
    })

    it('should call the AllocationService onSearchRole and update similarRoles', () => {
        // Mock the response for onSearchRole
        allocationService.onSearchRole.mockReturnValue(of([{ name: 'Role1', type: 'Type1' }]))
        const event = { target: { value: 'Role' } }

        component.onSearchRole(event)

        // Verify that the service is called and similarRoles is populated
        expect(allocationService.onSearchRole).toHaveBeenCalledWith('Role')
        expect(component.similarRoles.length).toBe(1)
        expect(component.similarRoles[0].name).toBe('Role1')
    })

    it('should handle selecting a role', () => {
        const role = { name: 'Role1', description: 'Role Description' }
        // selectRole picks the match out of similarRoles, which a search normally fills.
        component.similarRoles = [{
            name: 'Role1',
            description: 'Role Description',
            type: undefined,
            status: undefined,
            childNodes: [],
        }]
        component.selectRole(role)

        expect(component.selectedRole).toEqual({
            type: undefined,
            name: 'Role1',
            description: 'Role Description',
            status: undefined,
            childNodes: [],
        })
    })

    it('should call saveWorkOrder and reset form data on success', () => {
        const mockResponse = { success: true }
        allocationService.createAllocation.mockReturnValue(of(mockResponse))

        const resetSpy = jest.spyOn(component.allocationFieldForm, 'reset')
        const closeSpy = jest.spyOn(dialogRef, 'close')

        // saveWorkOrder starts with `delete this.selectedCompetency['childCount']`, which
        // throws when the property is still undefined.
        component.selectedCompetency = {}
        component.saveWorkOrder()

        expect(allocationService.createAllocation).toHaveBeenCalled()
        expect(resetSpy).toHaveBeenCalled()
        expect(closeSpy).toHaveBeenCalledWith({ event: 'close', data: expect.any(Object) })
    })

    it('should map selected competency and update form values', () => {
        // The mapped entry's additionalProperties.competencyArea is written into the form.
        const competency = {
            name: 'Competency1',
            description: 'Competency Description',
            additionalProperties: { competencyArea: 'Area1' },
        }
        component.selectCompetency(competency)

        expect(component.selectedCompetency.length).toBe(1)
        expect(component.selectedCompetency[0].name).toBe('Competency1')
        expect(component.allocationFieldForm.controls['competency'].value).toBe('Competency1')
    })

    it('should update the loader visibility', () => {
        // const setStyleSpy = jest.spyOn(document, 'getElementById').mockReturnValue({
        //     style: { display: '' },
        // })

        // component.displayLoader('true')
        // expect(setStyleSpy).toHaveBeenCalledWith('loader')
        // expect(setStyleSpy.mock.calls[0][0].style.display).toBe('block')

        // component.displayLoader('false')
        // expect(setStyleSpy.mock.calls[1][0].style.display).toBe('none')
    })
})
