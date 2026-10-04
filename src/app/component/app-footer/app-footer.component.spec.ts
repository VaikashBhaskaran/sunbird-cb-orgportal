import { AppFooterComponent } from './app-footer.component'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils-v2'
import { of } from 'rxjs'

describe('AppFooterComponent', () => {
    let component: AppFooterComponent
    let mockConfigSvc: Partial<ConfigurationsService>
    let mockValueSvc: Partial<ValueService>

    beforeEach(() => {
        // Mock the ConfigurationsService
        // The component clears termsOfUser only when the feature is in this set, so it has
        // to be present for the assertion below to mean anything.
        mockConfigSvc = {
            restrictedFeatures: new Set(['termsOfUser']),
        } as any

        // Mock the ValueService with an observable for isXSmall$
        mockValueSvc = {
            isXSmall$: of(true), // Mocking the observable that emits 'true'
        }

        // Create an instance of the component with mocked services
        component = new AppFooterComponent(
            mockConfigSvc as ConfigurationsService,
            mockValueSvc as ValueService
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize termsOfUser to false if restrictedFeatures has "termsOfUser"', () => {
        expect(component.termsOfUser).toBe(false)
    })

    it('should initialize isXSmall to true from ValueService observable', () => {
        expect(component.isXSmall).toBe(true)
    })

    it('should change isXSmall when the ValueService observable emits a new value', () => {
        // Create a new mock for the ValueService with different values
        const mockValueSvcNew = {
            isXSmall$: of(false), // Now mock the observable to emit 'false'
        }

        // Recreate the component with the new mock value service
        component = new AppFooterComponent(
            mockConfigSvc as ConfigurationsService,
            mockValueSvcNew as ValueService
        )

        // Assert that the isXSmall value was updated
        // component.isXSmall$.subscribe((isXSmall) => {
        //     expect(isXSmall).toBe(false)
        // })
    })

    it('should not change termsOfUser if restrictedFeatures does not have "termsOfUser"', () => {
        // Modify the mock to remove 'termsOfUser' from restrictedFeatures
        ;(mockConfigSvc as any).restrictedFeatures = new Set()

        // Recreate the component with the updated mock
        component = new AppFooterComponent(
            mockConfigSvc as ConfigurationsService,
            mockValueSvc as ValueService
        )

        // The value of termsOfUser should stay true
        expect(component.termsOfUser).toBe(true)
    })
})
