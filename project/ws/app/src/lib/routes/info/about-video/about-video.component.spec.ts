import { AboutVideoComponent } from './about-video.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

describe('AboutVideoComponent', () => {
    let component: AboutVideoComponent
    let configServiceMock: any

    beforeEach(() => {
        // Create a mock for ConfigurationsService
        configServiceMock = {
            instanceConfig: {
                introVideo: {
                    en: 'https://example.com/video-en.mp4',
                    hi: 'https://example.com/video-hi.mp4'
                },
                details: {
                    appName: 'TestApp'
                }
            },
            restrictedFeatures: new Set(),
            userPreference: {
                selectedLocale: 'en'
            },
            pageNavBar: {
                color: 'white',
                type: 'primary'
            }
        }

        // Initialize the component with the mock service
        component = new AboutVideoComponent(configServiceMock as ConfigurationsService)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with correct default values', () => {
        // Before ngOnInit
        expect(component.introVideos).toBeUndefined()
        expect(component.isPartOfFirstTimeSetupV2).toBeFalsy()
        expect(component.locale).toBe('')
        expect(component.appName).toBe('')
        expect(component.showNextbutton).toBeFalsy()
    })

    it('should set up properties correctly in ngOnInit with English locale', () => {
        component.ngOnInit()

        expect(component.introVideos).toEqual({
            en: 'https://example.com/video-en.mp4',
            hi: 'https://example.com/video-hi.mp4'
        })
        expect(component.appName).toBe('TestApp')
        expect(component.locale).toBe('en')
        expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-en.mp4')
    })

    it('should set up properties correctly when locale is not available in introVideos', () => {
        configServiceMock.userPreference.selectedLocale = 'fr'

        component.ngOnInit()

        // Should default to English when locale is not found
        expect(component.locale).toBe('en')
        expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-en.mp4')
    })

    it('should set isPartOfFirstTimeSetupV2 to true when not in restrictedFeatures', () => {
        configServiceMock.restrictedFeatures = new Set()

        component.ngOnInit()

        expect(component.isPartOfFirstTimeSetupV2).toBeTruthy()
        expect(component.showNextbutton).toBeTruthy()
    })

    it('should set isPartOfFirstTimeSetupV2 to false when in restrictedFeatures', () => {
        configServiceMock.restrictedFeatures = new Set(['firstTimeSetupV2'])

        component.ngOnInit()

        expect(component.isPartOfFirstTimeSetupV2).toBeFalsy()
        expect(component.showNextbutton).toBeFalsy()
    })

    it('should handle the case when userPreference is undefined', () => {
        configServiceMock.userPreference = undefined

        component.ngOnInit()

        // Should default to 'en'
        expect(component.locale).toBe('en')
    })

    it('should currently throw when instanceConfig is undefined', () => {
        configServiceMock.instanceConfig = undefined

        // ngOnInit guards the instanceConfig read but then calls Object.keys(introVideos)
        // unguarded a few lines later, so the whole hook dies when there is no instance
        // config. Recorded in product-bugs.md; pinned here as it behaves.
        expect(() => component.ngOnInit()).toThrow(TypeError)

        expect(component.introVideos).toBeUndefined()
        expect(component.appName).toBe('')
    })

    it('should update widget data URL when onItemChange is called', () => {
        component.ngOnInit()

        // Initial URL should be for English
        expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-en.mp4')

        // Change to Hindi
        component.onItemChange('hi')

        // URL should be updated to Hindi version
        expect(component.widgetResolverData.widgetData.url).toBe('https://example.com/video-hi.mp4')
    })

    it('should preserve other widget resolver properties when updating URL', () => {
        const initialWidgetData = { ...component.widgetResolverData }

        component.ngOnInit()
        component.onItemChange('hi')

        // Check that only URL is changed, other properties are preserved
        expect(component.widgetResolverData.widgetType).toBe(initialWidgetData.widgetType)
        expect(component.widgetResolverData.widgetSubType).toBe(initialWidgetData.widgetSubType)
        expect(component.widgetResolverData.widgetHostClass).toBe(initialWidgetData.widgetHostClass)
        expect(component.widgetResolverData.widgetHostStyle).toEqual(initialWidgetData.widgetHostStyle)
    })
})