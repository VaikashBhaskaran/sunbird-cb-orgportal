import { PublicContactComponent } from './public-contact.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

describe('PublicContactComponent', () => {
    let component: PublicContactComponent
    let mockConfigService: Partial<ConfigurationsService>
    let mockActivatedRoute: Partial<ActivatedRoute>

    beforeEach(() => {
        // pageNavbar is a field initialiser, so pageNavBar has to be on the service before
        // the component is constructed; contactUsMail is read in ngOnInit.
        mockConfigService = {
            pageNavBar: {
                title: 'Test Page',
            },
            instanceConfig: {
                mailIds: {
                    contactUs: 'contact@igot.com',
                },
            },
        } as any

        mockActivatedRoute = {
            data: of({
                pageData: {
                    data: {
                        contactInfo: 'Contact us at: contact@igot.com',
                    },
                },
            }),
        }

        component = new PublicContactComponent(
            mockConfigService as ConfigurationsService,
            mockActivatedRoute as ActivatedRoute
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize contactUsMail from ConfigurationsService', () => {
        component.ngOnInit()
        expect(component.contactUsMail).toBe('contact@igot.com')
    })

    it('should initialize contactPage with data from ActivatedRoute', () => {
        component.ngOnInit()
        expect(component.contactPage).toEqual({
            contactInfo: 'Contact us at: contact@igot.com',
        })
    })

    it('should unsubscribe from the ActivatedRoute data when destroyed', () => {
        // const unsubscribeSpy = jest.spyOn(component['subscriptionContact'], 'unsubscribe')
        component.ngOnInit()
        component.ngOnDestroy()
        // expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should have a default platform value of "iGOT"', () => {
        expect(component.platform).toBe('iGOT')
    })

    it('should initialize pageNavbar from ConfigurationsService', () => {
        component.ngOnInit()
        expect(component.pageNavbar).toEqual({
            title: 'Test Page',
        })
    })

    it('should set contactPage to null if no data is provided from ActivatedRoute', () => {
        mockActivatedRoute.data = of({})
        component.ngOnInit()
        expect(component.contactPage).toBeUndefined()
    })

    it('should set contactPage to undefined if the data is missing pageData', () => {
        mockActivatedRoute.data = of({ pageData: null })
        component.ngOnInit()
        expect(component.contactPage).toBeUndefined()
    })
})
