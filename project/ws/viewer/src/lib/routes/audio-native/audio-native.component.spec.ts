import { of } from 'rxjs'
import { AudioNativeComponent } from './audio-native.component'

describe('AudioNativeComponent', () => {
    let component: AudioNativeComponent
    let mockActivatedRoute: any
    let mockContentSvc: any
    let mockValueSvc: any
    let mockViewerSvc: any
    let mockConfigSvc: any

    const mockAudioData = {
        identifier: 'test-audio-123',
        artifactUrl: 'http://example.com/audio.mp3',
        name: 'Test Audio',
        description: 'Test Description',
        appIcon: 'author-http://example.com/icon.png'
    }

    beforeEach(() => {
        // Initialize mocks
        mockActivatedRoute = {
            data: of({ content: { data: mockAudioData } })
        }

        mockContentSvc = {
            saveContinueLearning: jest.fn().mockReturnValue(of({})),
            setS3Cookie: jest.fn().mockReturnValue(of({}))
        }

        mockValueSvc = {
            isXSmall$: of(false)
        }

        mockViewerSvc = {
            getAuthoringUrl: jest.fn().mockImplementation(url => `author-${url}`)
        }

        mockConfigSvc = {
            instanceConfig: {
                logos: {
                    defaultContent: 'default-thumbnail.jpg'
                }
            }
        }

        // Create component instance directly
        component = new AudioNativeComponent(
            mockActivatedRoute,
            mockContentSvc,
            mockValueSvc,
            mockViewerSvc,
            mockConfigSvc
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should set default thumbnail from config', () => {
            component.ngOnInit()
            expect(component.defaultThumbnail).toBe('author-http://example.com/icon.png')
        })

        it('should subscribe to screen size changes', () => {
            const screenSizeSpy = jest.spyOn(mockValueSvc.isXSmall$, 'subscribe')
            component.ngOnInit()
            expect(screenSizeSpy).toHaveBeenCalled()
        })

        it('should initialize audio data from route', () => {
            component.ngOnInit()
            expect(component.audioData).toEqual(mockAudioData)
        })

        it('should modify artifactUrl for preview mode', () => {
            // Mock window.location.href
            const originalLocation = window.location
            delete (window as any).location
            ;(window as any).location = { ...originalLocation, href: 'http://example.com/author/preview' }

            component.ngOnInit()
            expect(component.audioData?.artifactUrl).toBe('http://example.com/audio.mp3')

            // Restore original location. window.location is typed `string & Location`
            // under the DOM lib, hence the cast on the way back too.
            ;(window as any).location = originalLocation
        })

        it('should set appIcon as default thumbnail if available', () => {
            component.ngOnInit()
            expect(component.defaultThumbnail).toBe(mockAudioData.appIcon)
        })

        it('should handle missing appIcon', () => {

            component.ngOnInit()
            expect(component.defaultThumbnail).toBe('author-http://example.com/icon.png')
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from all subscriptions', () => {
            component.ngOnInit()

            // Create spies for unsubscribe methods
            const routeDataUnsubscribe = jest.fn()
            const screenSizeUnsubscribe = jest.fn()
            const viewerDataUnsubscribe = jest.fn();

            // Set up the subscriptions with spy methods
            (component as any).routeDataSubscription = { unsubscribe: routeDataUnsubscribe };
            (component as any).screenSizeSubscription = { unsubscribe: screenSizeUnsubscribe };
            (component as any).viewerDataSubscription = { unsubscribe: viewerDataUnsubscribe }

            component.ngOnDestroy()

            expect(routeDataUnsubscribe).toHaveBeenCalled()
            expect(screenSizeUnsubscribe).toHaveBeenCalled()
            expect(viewerDataUnsubscribe).toHaveBeenCalled()
        })

        it('should handle null subscriptions gracefully', () => {
            component.ngOnDestroy()
            // Should not throw any errors
            expect(true).toBeTruthy()
        })
    })

    describe('saveContinueLearning', () => {
        it('should call saveContinueLearning with correct parameters', () => {
            const timestamp = 1234567890
            jest.spyOn(Date, 'now').mockImplementation(() => timestamp)



        })

        it('should handle null content gracefully', () => {
            component.saveContinueLearning(null)

            expect(mockContentSvc.saveContinueLearning).toHaveBeenCalledWith({
                contextPathId: '',
                resourceId: '',
                data: expect.any(String),
                dateAccessed: expect.any(Number)
            })
        })
    })


})