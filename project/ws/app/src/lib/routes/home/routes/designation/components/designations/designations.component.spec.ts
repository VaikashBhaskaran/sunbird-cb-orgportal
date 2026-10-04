import { DesignationsComponent } from './designations.component'
import { of, throwError } from 'rxjs'
import { DesignationsService } from '../../services/designations.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'

jest.mock('../../services/designations.service')
jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')

describe('DesignationsComponent', () => {
    let component: DesignationsComponent
    let designationsService: jest.Mocked<DesignationsService>
    let dialog: MatDialog
    let snackBar: MatSnackBar
    let activatedRoute: ActivatedRoute

    beforeEach(() => {
        // Mock the service and its methods
        designationsService = new DesignationsService(null as any, null as any) as jest.Mocked<DesignationsService> // Force the type to mock
        dialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) // Mock constructor for MatDialog
        snackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any) // Mock constructor for MatSnackBar
        // A plain stub: the module-level jest.mock of @angular/router left ActivatedRoute
        // undefined, so it could not be constructed.
        activatedRoute = {
            snapshot: { data: { pageData: { data: {} } } },
            data: of({})
        } as unknown as ActivatedRoute

        component = new DesignationsComponent(designationsService, dialog, activatedRoute, snackBar)
        // this.environment is assigned in ngOnInit; methods under test write to it directly.
        component.environment = {}
        // The error branch reads its message out of designationConfig.
        component.designationConfig = { internalErrorMsg: 'Something went wrong' } as any

        // Now mock methods in the service
        designationsService.setUserProfile = jest.fn()
        designationsService.setFrameWorkInfo = jest.fn()
        designationsService.getFrameworkInfo = jest.fn()
        designationsService.getOrgReadData = jest.fn()
        designationsService.createFrameWork = jest.fn()
        designationsService.deleteDesignation = jest.fn()
        designationsService.publishFramework = jest.fn()
        snackBar.open = jest.fn()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should handle framework info retrieval', () => {
        const frameworkInfo = { result: { framework: 'frameworkData' } }

        // Mock the method to return an observable
        designationsService.getFrameworkInfo.mockReturnValue(of(frameworkInfo))

        component.getFrameworkInfo('framework-id')
        expect(designationsService.getFrameworkInfo).toHaveBeenCalledWith('framework-id')
        expect(component.frameworkDetails).toEqual(frameworkInfo.result.framework)
    })

    it('should handle framework info retrieval error', () => {
        // Mock the method to return an error observable
        designationsService.getFrameworkInfo.mockReturnValue(throwError('Error'))

        component.getFrameworkInfo('framework-id')
        expect(snackBar.open).toHaveBeenCalledWith(expect.any(String), 'X', { duration: 5000 })
    })

    // Other tests...
})
