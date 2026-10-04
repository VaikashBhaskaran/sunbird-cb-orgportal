import { MobileAppHomeComponent } from './mobile-app-home.component'
import { of } from 'rxjs'

jest.mock('@angular/router')
jest.mock('@angular/platform-browser')
jest.mock('../../../../services/mobile-apps.service')
jest.mock('@sunbird-cb/utils-v2')

describe('MobileAppHomeComponent', () => {
    let component: MobileAppHomeComponent
    let mockActivatedRoute: any
    let mockSanitizer: any
    let mockMobileService: any
    let mockConfigService: any
    let mockPlatform: any

    beforeEach(() => {
        // Mocking services
        mockActivatedRoute = {
            data: of({ pageData: { data: { appsIos: 'http://example.com/ios', showQrCode: true, isClient: true } } })
        }
        mockSanitizer = {
            bypassSecurityTrustUrl: jest.fn().mockReturnValue('safeUrl')
        }
        mockMobileService = {
            iOsAppRef: true,
            isAndroidApp: false
        }
        mockConfigService = {
            pageNavBar: {}
        }
        mockPlatform = {
            IOS: false
        }

        // Create an instance of the component
        component = new MobileAppHomeComponent(
            mockSanitizer,
            mockActivatedRoute,
            mockPlatform,
            mockMobileService,
            mockConfigService
        )
    })

    it('should create the component', () => {
        expect(component).toBeDefined()
    })

    it('should initialize mobileLinks and other properties on ngOnInit', () => {
        // Call ngOnInit to trigger the initialization logic
        component.ngOnInit()

        // Check if mobileLinks was populated
        expect(component.mobileLinks).toBeDefined()
        expect(component.mobileLinks?.appsIosSanitized).toBe('safeUrl')
        expect(component.isClient).toBe(true)
        expect(component.isAndroidPlayStoreLink).toBe(true)
        expect(component.selectedTabIndex).toBe(0)  // because matPlatform.IOS is false
    })

    it('should handle ngOnDestroy correctly', () => {
        // ngOnInit is what creates routeSubscription, so drive it first and spy on the
        // real subscription rather than planting a stand-in.
        component.ngOnInit()
        expect(component.routeSubscription).toBeTruthy()
        const unsubscribeSpy = jest.spyOn(component.routeSubscription!, 'unsubscribe')

        // Call ngOnDestroy to trigger the cleanup logic
        component.ngOnDestroy()

        // Ensure that unsubscribe is called
        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should handle Android and iOS app references correctly', () => {
        // Both flags start true and ngOnInit only ever clears them, so the second case
        // needs a fresh component rather than a second ngOnInit on the same one.
        mockMobileService.iOsAppRef = true
        mockMobileService.isAndroidApp = false
        component.ngOnInit()
        expect(component.isAndriod).toBe(false)
        expect(component.isIos).toBe(true)

        // Test when isAndroidApp is set
        mockMobileService.iOsAppRef = false
        mockMobileService.isAndroidApp = true
        const androidComponent = new MobileAppHomeComponent(
            mockSanitizer,
            mockActivatedRoute,
            mockPlatform,
            mockMobileService,
            mockConfigService
        )
        androidComponent.ngOnInit()
        expect(androidComponent.isAndriod).toBe(true)
        expect(androidComponent.isIos).toBe(false)
    })
})
