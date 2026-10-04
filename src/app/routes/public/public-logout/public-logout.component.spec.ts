import { PublicLogoutComponent } from './public-logout.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

// Mock the dependencies
jest.mock('@sunbird-cb/utils-v2', () => ({
    ConfigurationsService: jest.fn().mockImplementation(() => ({
        pageNavBar: { background: 'blue' },
        instanceConfig: { mailIds: { contactUs: 'contact@domain.com' } }
    })),
    NsPage: {
        INavBackground: jest.fn(),
    }
}))

jest.mock('@angular/router', () => ({
    ActivatedRoute: jest.fn().mockImplementation(() => ({
        data: of({ pageData: { data: 'some data' } })
    }))
}))

describe('PublicLogoutComponent', () => {
    let component: PublicLogoutComponent
    let mockConfigSvc: ConfigurationsService
    let mockActivatedRoute: ActivatedRoute

    beforeEach(() => {
        // Create a new instance of the component
        mockConfigSvc = new ConfigurationsService(null as any)
        mockActivatedRoute = new ActivatedRoute()

        component = new PublicLogoutComponent(mockConfigSvc, mockActivatedRoute)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should set contactUsMail on ngOnInit', () => {
        component.ngOnInit()
        expect(component.contactUsMail).toBe('contact@domain.com')
    })

    it('should set contactPage from activated route data', () => {
        component.ngOnInit()
        expect(component.contactPage).toBe('some data')
    })

    it('should set pageNavbar to the value from configSvc', () => {
        component.ngOnInit()
        expect(component.pageNavbar).toEqual({ background: 'blue' })
    })

    it('should unsubscribe on ngOnDestroy', () => {
        // subscriptionContact is null until ngOnInit subscribes to the route data.
        component.ngOnInit()
        const unsubscribeSpy = jest.spyOn(component['subscriptionContact']!, 'unsubscribe')
        // No second ngOnInit here: it would replace subscriptionContact with a fresh
        // subscription and ngOnDestroy would then unsubscribe that one instead.
        component.ngOnDestroy() // Destroy the subscription
        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should redirect to login page on login()', () => {
        // window.location is typed `string & Location` under the DOM lib, so the stand-in
        // needs an `any` cast. Capture the origin first: login() reads it off the real
        // location, and the replacement below does not carry one.
        const originalLocation = global.window.location
        const origin = originalLocation.origin
        // jsdom's window.location is a non-writable accessor, so a plain assignment is
        // silently ignored - it has to be redefined. Capture the origin first: login()
        // reads it off location, and the stand-in below supplies its own.
        Object.defineProperty(global.window, 'location', {
            value: { href: '', origin },
            writable: true,
            configurable: true,
        })

        component.login()
        expect(global.window.location.href).toBe(`${origin}/protected/v8/resource`)

        Object.defineProperty(global.window, 'location', {
            value: originalLocation,
            writable: true,
            configurable: true,
        })
    })
})
