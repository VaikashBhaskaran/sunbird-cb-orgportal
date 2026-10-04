import { InfrastructureComponent } from './infrastructure.component'
import { OrgProfileService } from '../../services/org-profile.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { MatDialog } from '@angular/material/dialog'
import { of } from 'rxjs'
import { UntypedFormGroup } from '@angular/forms'
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component'
import _ from 'lodash'

jest.mock('../../services/org-profile.service')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/material/dialog')

describe('InfrastructureComponent', () => {
    let component: InfrastructureComponent
    let orgProfileServiceMock: jest.Mocked<OrgProfileService>
    let configServiceMock: jest.Mocked<ConfigurationsService>
    let dialogMock: jest.Mocked<MatDialog>

    beforeEach(() => {
        // Initialize mocks
        orgProfileServiceMock = new OrgProfileService(null as any) as jest.Mocked<OrgProfileService>

        // jest.mock auto-mocks the class's methods but not its instance fields, so
        // formValues - which the component reads in ngOnInit - has to be restored by hand.
        orgProfileServiceMock.formValues = {
            instituteProfile: {},
            rolesAndFunctions: {},
            infrastructure: {},
            trainingPrograms: {},
            research: {},
            consultancy: {},
            faculty: {},
            platformWalkthrough: {},
        }
        configServiceMock = new ConfigurationsService(null as any) as jest.Mocked<ConfigurationsService>
        dialogMock = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatDialog>

        // Mock any services or observable values
        configServiceMock.unMappedUser = {
            orgProfile: {
                profileDetails: {
                    infrastructure: {
                        builtupArea: 1000,
                        academicArea: 500,
                        hostelArea: 200,
                        computerLabArea: 300,
                        computerSystemCount: 50,
                        totalCollection: 150,
                        periodicalsSubscribed: true,
                        latitudeLongitude: '12.34, 56.78',
                    }
                }
            }
        }

        component = new InfrastructureComponent(orgProfileServiceMock, configServiceMock, dialogMock)

        // Manually trigger ngOnInit and other lifecycle hooks
        component.ngOnInit()
    })

    it('should initialize the form correctly', () => {
        expect(component.infrastructureForm).toBeInstanceOf(UntypedFormGroup)
        expect(component.infrastructureForm.get('builtupArea')).toBeDefined()
        expect(component.infrastructureForm.get('academicArea')).toBeDefined()
        expect(component.infrastructureForm.get('hostelArea')).toBeDefined()
        expect(component.infrastructureForm.get('computerLabArea')).toBeDefined()
        expect(component.infrastructureForm.get('computerSystemCount')).toBeDefined()
        expect(component.infrastructureForm.get('totalCollection')).toBeDefined()
        expect(component.infrastructureForm.get('periodicalsSubscribed')).toBeDefined()
        expect(component.infrastructureForm.get('latitudeLongitude')).toBeDefined()
    })

    it('should pre-populate the form if user profile data exists', () => {
        expect(component.infrastructureForm.get('builtupArea')?.value).toBe(1000)
        expect(component.infrastructureForm.get('academicArea')?.value).toBe(500)
        expect(component.infrastructureForm.get('hostelArea')?.value).toBe(200)
        expect(component.infrastructureForm.get('computerLabArea')?.value).toBe(300)
        expect(component.infrastructureForm.get('computerSystemCount')?.value).toBe(50)
        expect(component.infrastructureForm.get('totalCollection')?.value).toBe(150)
        expect(component.infrastructureForm.get('periodicalsSubscribed')?.value).toBe(true)
        expect(component.infrastructureForm.get('latitudeLongitude')?.value).toBe('12.34, 56.78')
    })

    it('should call orgSvc.updateLocalFormValue and orgSvc.updateFormStatus on form value change', async () => {
        // The form subscription is debounced by 500ms, and spying on an already-mocked
        // method keeps the emission from ngOnInit in the call history - hence mockClear and
        // the real wait. Zone.js patches the timers jest's fake clock would replace.
        const updateLocalFormValueSpy = jest.spyOn(orgProfileServiceMock, 'updateLocalFormValue')
        const updateFormStatusSpy = jest.spyOn(orgProfileServiceMock, 'updateFormStatus')
        updateLocalFormValueSpy.mockClear()
        updateFormStatusSpy.mockClear()

        // Trigger form value change
        component.infrastructureForm.patchValue({ builtupArea: 2000 })
        await new Promise(resolve => setTimeout(resolve, 600))

        expect(updateLocalFormValueSpy).toHaveBeenCalledWith('infrastructure', component.infrastructureForm.value)
        expect(updateFormStatusSpy).toHaveBeenCalledWith('infrastructure', component.infrastructureForm.valid)
    })

    it('should open activity dialog when openActivityDialog is called', () => {
        const dialogOpenSpy = jest.spyOn(dialogMock, 'open')
            .mockReturnValue({
                afterClosed: () => of('closed')
            } as any)

        component.openActivityDialog()

        expect(dialogOpenSpy).toHaveBeenCalledWith(DialogBoxComponent, {
            data: { view: 'infra' },
            hasBackdrop: false,
            width: '550px',
        })
    })

    it('should open longitude dialog when openLongitudeDialog is called', () => {
        const dialogOpenSpy = jest.spyOn(dialogMock, 'open')
            .mockReturnValue({
                afterClosed: () => of('closed')
            } as any)

        component.openLongitudeDialog()

        expect(dialogOpenSpy).toHaveBeenCalledWith(DialogBoxComponent, {
            data: { view: 'longitude' },
            hasBackdrop: false,
            width: '550px',
        })
    })
})
