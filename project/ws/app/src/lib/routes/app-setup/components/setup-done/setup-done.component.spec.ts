import { SetupDoneComponent } from './setup-done.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { MatDialog } from '@angular/material/dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { DomSanitizer } from '@angular/platform-browser'
import { Globals } from '../../globals'
import { AppTourDialogComponent } from '@sunbird-cb/collection'
import { of } from 'rxjs'

jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/router')
jest.mock('@angular/platform-browser')
jest.mock('@angular/material/dialog')
jest.mock('../../globals')

describe('SetupDoneComponent', () => {
    let component: SetupDoneComponent
    let mockConfigSvc: ConfigurationsService
    let mockRoute: ActivatedRoute
    let mockDomSanitizer: DomSanitizer
    let mockMatDialog: MatDialog
    let mockRouter: Router
    let mockGlobals: Globals

    beforeEach(() => {
        // Mock the services
        mockConfigSvc = new ConfigurationsService(null as any) // You can pass mock data if necessary
        // ngOnInit reads data.badges.data off the route, so the stream has to emit it.
        mockRoute = { data: of({ badges: { data: 'testBadge' } }) } as unknown as ActivatedRoute
        mockDomSanitizer = { bypassSecurityTrustResourceUrl: jest.fn() } as unknown as DomSanitizer
        mockMatDialog = { open: jest.fn() } as unknown as MatDialog
        mockRouter = { navigate: jest.fn() } as unknown as Router
        mockGlobals = { firstTimeSetupDone: false } as unknown as Globals

        // Create component instance with mocked services
        component = new SetupDoneComponent(
            mockConfigSvc,
            mockRoute,
            mockDomSanitizer,
            mockMatDialog,
            mockRouter,
            mockGlobals,
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should set badges from route data and sanitize appIcon if instanceConfig is available', () => {
            // The appIcon branch only runs when instanceConfig is present.
            mockConfigSvc.instanceConfig = { logos: { thumpsUp: 'testLogoUrl' } } as any
            ;(mockDomSanitizer.bypassSecurityTrustResourceUrl as jest.Mock)
                .mockReturnValue('safeLogoUrl')

            component.ngOnInit()

            expect(component.badges).toEqual('testBadge')
            expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('testLogoUrl')
            expect(component.appIcon).toBeTruthy()
        })

        it('should not set appIcon if instanceConfig is not available', () => {
            mockConfigSvc.instanceConfig = null
            component.ngOnInit()

            expect(component.appIcon).toBeNull()
        })
    })

    describe('finishSetup', () => {
        it('should update globals and open a dialog, then navigate to home', () => {
            component.finishSetup()

            expect(mockGlobals.firstTimeSetupDone).toBe(true)
            expect(mockMatDialog.open).toHaveBeenCalledWith(AppTourDialogComponent, {
                width: '500px',
                minHeight: '350px',
                data: 'dialog',
                backdropClass: 'backdropBackground',
            })
            expect(mockRouter.navigate).toHaveBeenCalledWith(['page', 'home'])
        })
    })
})
