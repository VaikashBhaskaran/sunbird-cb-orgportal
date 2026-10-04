import { CustomSelfRegistrationComponent } from './custom-self-registration.component'
import { OnboardingService } from '../../../services/onboarding.service'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Clipboard } from '@angular/cdk/clipboard'
import { of, throwError } from 'rxjs'

// Mock dependencies
jest.mock('@angular/material/dialog')
jest.mock('@angular/router')
jest.mock('../../../services/onboarding.service')
jest.mock('@angular/cdk/clipboard')
jest.mock('@angular/material/snack-bar')

describe('CustomSelfRegistrationComponent', () => {
  let component: CustomSelfRegistrationComponent
  let onboardingService: jest.Mocked<OnboardingService>
  let dialog: MatDialog
  let router: Router
  let activatedRoute: ActivatedRoute
  let formBuilder: FormBuilder
  let snackbar: MatSnackBar
  let clipboard: Clipboard

  beforeEach(() => {
    // Mock implementations
    router = { navigate: jest.fn() } as unknown as Router
    activatedRoute = {
      parent: {
        snapshot: {
          data: {
            configService: { userProfile: { rootOrgId: 'rootOrgId' }, orgReadData: { frameworkid: 'frameworkId' } },
            pageData: { data: {} },
          }
        }
      }
    } as unknown as ActivatedRoute
    formBuilder = new FormBuilder()
    snackbar = { open: jest.fn() } as unknown as MatSnackBar
    clipboard = { copy: jest.fn() } as unknown as Clipboard

    // Mocking OnboardingService methods
    onboardingService = {
      getListOfRegisteedLinks: jest.fn(),
      generateSelfRegistrationQRCode: jest.fn(),
    } as unknown as jest.Mocked<OnboardingService>

    dialog = { open: jest.fn() } as unknown as MatDialog

    // Create component instance
    component = new CustomSelfRegistrationComponent(
      dialog,
      activatedRoute,
      router,
      formBuilder,
      snackbar,
      clipboard,
      onboardingService,
      // ngOnInit reaches getFrameworkInfo on this one, so it needs a real stream.
      { getFrameworkInfo: jest.fn().mockReturnValue(of({ result: { framework: {} } })) } as any,
      { raiseInteractTelemetry: jest.fn() } as any,
      // LoaderService, added since this spec was written.
      { changeLoaderState: jest.fn(), changeLoad: { next: jest.fn() } } as any
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should call ngOnInit and initialize the form', () => {
    component.ngOnInit()
    expect(component.rootOrdId).toBe('rootOrgId')
    expect(component.framewordId).toBe('frameworkId')
    expect(component.selfRegistrationForm instanceof FormGroup).toBeTruthy()
  })

  it('should get the list of registration links', () => {
    // selfRegistrationForm is built in ngOnInit, which these reach through.
    component.ngOnInit()
    const mockResponse = {
      result: {
        qrCodeDataForOrg: [{ startDate: '2025-02-27', endDate: '2025-03-27', url: 'test.com' }]
      }
    }

    onboardingService.getListOfRegisteedLinks.mockReturnValue(of(mockResponse))  // Mocking the method with mockReturnValue

    component.getlistOfRegisterationLinks()
    expect(component.registeredLinksList.length).toBe(1)
    expect(component.customRegistrationLinks.registrationLink).toBe('test.com')
  })

  it('should handle error in getlistOfRegisterationLinks gracefully', () => {
    onboardingService.getListOfRegisteedLinks.mockReturnValue(throwError(() => new Error('Error')))

    component.getlistOfRegisterationLinks()
    expect(component.isLoading).toBe(false)
  })

  it('should copy link to clipboard and show snackbar', () => {
    component.copyLinkToClipboard('test.com')
    expect(clipboard.copy).toHaveBeenCalledWith('test.com')
    expect(snackbar.open).toHaveBeenCalledWith('Copied!', '', { panelClass: ['success'] })
  })

  it('should generate registration link and handle response successfully', () => {
    // selfRegistrationForm is built in ngOnInit, which these reach through.
    component.ngOnInit()
    // generateRegistrationLink reads getTime() off both date controls.
    component.selfRegistrationForm.controls['startDate'].setValue(new Date('2025-01-01'))
    component.selfRegistrationForm.controls['endDate'].setValue(new Date('2025-02-01'))
    const mockResponse = {
      result: {
        registrationLink: 'generatedLink.com',
        qrRegistrationLink: 'qrGeneratedLink',
        qrCodeLogoPath: 'qrCodeLogoPath'
      },
      responseCode: 'OK'
    }

    onboardingService.generateSelfRegistrationQRCode.mockReturnValue(of(mockResponse))  // Mocking the method with mockReturnValue

    component.generateRegistrationLink()
    expect(component.customRegistrationLinks.registrationLink).toBe('generatedLink.com')
    expect(component.latestRegisteredData.startDate).toBeInstanceOf(Date)
    expect(component.latestRegisteredData.endDate).toBeInstanceOf(Date)
  })

  it('should handle error in generateRegistrationLink', () => {
    // selfRegistrationForm is built in ngOnInit, which these reach through.
    component.ngOnInit()
    // generateRegistrationLink reads getTime() off both date controls.
    component.selfRegistrationForm.controls['startDate'].setValue(new Date('2025-01-01'))
    component.selfRegistrationForm.controls['endDate'].setValue(new Date('2025-02-01'))
    // const dialogRef = { close: jest.fn() }
    // dialog.open.mockReturnValue(dialogRef)

    onboardingService.generateSelfRegistrationQRCode.mockReturnValue(throwError(() => new Error('Error')))

    component.generateRegistrationLink()
    //expect(dialogRef.close).toHaveBeenCalled()
  })

  it('should navigate to the correct route', () => {
    component.navigateTo('/some-route')
    expect(router.navigate).toHaveBeenCalledWith(['/some-route'])
  })

  it('should check registration status', () => {
    // selfRegistrationForm is built in ngOnInit, which these reach through.
    component.ngOnInit()
    // Relative to now rather than a fixed date: the method compares the end date against
    // today, so a hard-coded one silently starts failing once it passes.
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const status = component.checkRegistrationStatus(nextMonth.toISOString())
    expect(status).toBe(true)
  })

  it('should report a registration whose end date has passed as closed', () => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    expect(component.checkRegistrationStatus(lastMonth.toISOString())).toBe(false)
  })

  it('should handle check registration status with invalid date', () => {
    const status = component.checkRegistrationStatus('')
    expect(status).toBe(false)
  })
})
