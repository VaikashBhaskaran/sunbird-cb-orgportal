import { ConsultancyComponent } from './consultancy.component'
import { OrgProfileService } from '../../services/org-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import _ from 'lodash'
import { of } from 'rxjs'

// Mock dependencies
jest.mock('../../services/org-profile.service')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/router')
jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')
jest.mock('lodash')

describe('ConsultancyComponent', () => {
    let component: ConsultancyComponent
    let orgSvc: OrgProfileService
    let configSvc: ConfigurationsService
    let router: Router
    let dialog: MatDialog
    let snackBar: MatSnackBar

    beforeEach(() => {
        orgSvc = new OrgProfileService(null as any)  // Mocked instance, replace with actual mock

        // jest.mock auto-mocks the class's methods but not its instance fields, so
        // formValues - which the component reads in ngOnInit - has to be restored by hand.
        orgSvc.formValues = {
            instituteProfile: {},
            rolesAndFunctions: {},
            infrastructure: {},
            trainingPrograms: {},
            research: {},
            consultancy: {},
            faculty: {},
            platformWalkthrough: {},
        }
        configSvc = new ConfigurationsService(null as any)  // Mocked instance, replace with actual mock
        router = new Router()  // Mocked instance
        dialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any)  // Mocked instance
        snackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)  // Mocked instance

        component = new ConsultancyComponent(
            orgSvc,
            configSvc,
            router,
            dialog,
            snackBar
        )

        // Mock methods
        orgSvc.updateFormStatus = jest.fn()
        configSvc.unMappedUser = { orgProfile: { profileDetails: { consultancy: { projects: [] } } } }
        // The real MatDialog cannot open anything here, so hand back a ref that closes
        // immediately with a confirmation.
        dialog.open = jest.fn(() => ({ afterClosed: () => of(true) })) as any
        snackBar.open = jest.fn()
    })

    it('should create the component', () => {
        expect(component).toBeDefined()
    })

    it('should initialize consultancy form with default values', () => {
        expect(component.consultancyForm.get('projectName')).toBeDefined()
        expect(component.consultancyForm.get('programeStatus')?.value).toBe('Ongoing')
        expect(component.consultancyForm.get('industrySponsored')?.value).toBe(true)
        // Only industrySponsored is seeded with a boolean; the other two start empty.
        expect(component.consultancyForm.get('govtSponsored')?.value).toBe('')
    })

    it('should call orgSvc.updateFormStatus in ngOnInit', () => {
        component.ngOnInit()
        expect(orgSvc.updateFormStatus).toHaveBeenCalledWith('consultancy', true)
    })

    it('should handle addProject when form is valid', () => {
        // Mock valid form values
        component.consultancyForm.setValue({
            projectName: 'Test Project',
            programeStatus: 'Ongoing',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: false,
            projectDetail: 'Test Details',
        })
        component.addProject()

        expect(component.addedconsultancies.length).toBe(1)
        // resetConsultancyForm clears the form through FormGroup.reset.
        expect(component.consultancyForm.get('projectName')?.value).toBeNull()
        expect(orgSvc.updateLocalFormValue).toHaveBeenCalledWith('consultancy', { projects: component.addedconsultancies })
    })

    it('should not add project if form is invalid', () => {
        // Mock invalid form values
        component.consultancyForm.setValue({
            projectName: '',
            programeStatus: 'Ongoing',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: false,
            projectDetail: 'Test Details',
        })

        component.addProject()

        expect(component.addedconsultancies.length).toBe(0)
        expect(snackBar.open).toHaveBeenCalledWith('Project name, program status, sponsers type are required')
    })

    it('should call editProject and patch form values', () => {
        const mockProject = {
            projectName: 'Test Project',
            programeStatus: 'Completed',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: true,
            projectDetail: 'Test Details',
        }

        component.editProject(mockProject)

        expect(component.editValue).toBe(mockProject)
        expect(component.consultancyForm.get('projectName')?.value).toBe(mockProject.projectName)
        expect(component.consultancyForm.get('programeStatus')?.value).toBe(mockProject.programeStatus)
        expect(component.consultancyForm.get('industrySponsored')?.value).toBe(mockProject.industrySponsored)
    })

    it('should delete project and update values when confirmed', () => {
        const mockProject = { projectName: 'Test Project' }
        component.addedconsultancies = [{ projectName: 'Test Project' }]
        // const dialogRef = { afterClosed: jest.fn(() => ({ subscribe: jest.fn((cb) => cb(true)) })) }

        // dialog.open.mockReturnValue(dialogRef)
        component.deleteProject(mockProject)

        expect(dialog.open).toHaveBeenCalled()
        expect(component.addedconsultancies.length).toBe(0)
        expect(orgSvc.updateLocalFormValue).toHaveBeenCalledWith('consultancy', { projects: [] })
    })

    it('should open activity dialog', () => {
        component.openActivityDialog()
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), {
            data: { view: 'consultancy' },
            hasBackdrop: false,
            width: '550px',
        })
    })

    it('should call resetConsultancyForm correctly', () => {
        component.consultancyForm.setValue({
            projectName: 'Test',
            programeStatus: 'Completed',
            industrySponsored: true,
            govtSponsored: false,
            otherSponsored: true,
            projectDetail: 'Details',
        })

        component.resetConsultancyForm()

        // FormGroup.reset() clears controls to null unless given a value to reset to.
        expect(component.consultancyForm.get('projectName')?.value).toBeNull()
        expect(component.consultancyForm.get('programeStatus')?.value).toBe('Ongoing')
        expect(component.consultancyForm.get('industrySponsored')?.value).toBe(true)
    })
})
