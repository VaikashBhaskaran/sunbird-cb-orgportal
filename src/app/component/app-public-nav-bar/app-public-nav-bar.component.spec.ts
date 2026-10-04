import { AppPublicNavBarComponent } from './app-public-nav-bar.component'
import { DomSanitizer } from '@angular/platform-browser'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

describe('AppPublicNavBarComponent', () => {
    let component: AppPublicNavBarComponent
    let mockDomSanitizer: Partial<DomSanitizer>
    let mockConfigSvc: Partial<ConfigurationsService>

    beforeEach(() => {
        // Mock the DomSanitizer's bypassSecurityTrustResourceUrl method
        mockDomSanitizer = {
            bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue('safeUrl'),
        }

        // Mock the ConfigurationsService instanceConfig and primaryNavBar. ngOnInit does
        // nothing at all without instanceConfig, so it has to be present.
        mockConfigSvc = {
            instanceConfig: {
                logos: {
                    appTransparent: 'some-logo-url',
                },
                details: {
                    appName: 'Test App',
                },
            },
            primaryNavBar: { background: 'blue' },
        } as any

        // Create an instance of the component with the mocked services
        component = new AppPublicNavBarComponent(
            mockDomSanitizer as DomSanitizer,
            mockConfigSvc as ConfigurationsService
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set appIcon, appName, and navBar on ngOnInit', () => {
        component.ngOnInit()

        // Check if ngOnInit correctly sets the properties
        expect(component.appIcon).toBe('safeUrl')
        expect(component.appName).toBe('Test App')
        expect(component.navBar).toEqual({ background: 'blue' })

        // Ensure bypassSecurityTrustResourceUrl was called with the correct argument
        expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('some-logo-url')
    })

    it('should return true for showPublicNavbar', () => {
        expect(component.showPublicNavbar).toBe(true)
    })
})
