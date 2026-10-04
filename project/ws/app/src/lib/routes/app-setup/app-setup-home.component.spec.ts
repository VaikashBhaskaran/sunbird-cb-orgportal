import { AppSetupHomeComponent } from './app-setup-home.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { MatDialog } from '@angular/material/dialog'
import { StepperSelectionEvent } from '@angular/cdk/stepper'
import { of } from 'rxjs'

describe('AppSetupHomeComponent', () => {
    let component: AppSetupHomeComponent
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockMatDialog: jest.Mocked<MatDialog>

    beforeEach(() => {
        mockConfigSvc = {
            activeLocale: { path: 'en' },
            instanceConfig: { introVideo: { en: 'video-url' } },
            userUrl: 'user-url',
        } as any

        mockMatDialog = {
            open: jest.fn(() => ({
                afterClosed: jest.fn(() => of(false)),
            })),
        } as any

        component = new AppSetupHomeComponent(mockConfigSvc, mockMatDialog)
    })

    describe('ngOnInit', () => {
        it('should initialize component properties correctly', () => {
            component.ngOnInit()

            expect(component.appLanguage).toBe('en')
            expect(component.introVideos).toEqual({ en: 'video-url' })
            expect(component.widgetResolverData.widgetData.url).toBe('video-url')
        })
    })

    describe('prevBtn', () => {
        it('should decrease currentIndex by 1', () => {
            component.currentIndex = 1
            component.prevBtn()

            expect(component.currentIndex).toBe(0)
        })
    })

    describe('nextBtn', () => {
        it('should increase currentIndex by 1', () => {
            component.currentIndex = 0
            component.nextBtn()

            expect(component.currentIndex).toBe(1)
        })
    })

    describe('onChange', () => {
        it('should update currentIndex to selectedIndex', () => {
            const event: StepperSelectionEvent = { selectedIndex: 2 } as any
            component.onChange(event)

            expect(component.currentIndex).toBe(2)
        })
    })

    describe('langChanged', () => {
        it('should update chosenLang with provided path', () => {
            const path = 'fr'
            component.langChanged(path)

            expect(component.chosenLang).toBe('fr')
        })
    })

    describe('applyChanges', () => {
        it('should call MatDialog.open and handle afterClosed subscription', () => {
            const template = {}
            component.applyChanges(template)

            expect(mockMatDialog.open).toHaveBeenCalledWith(template, {
                width: '400px',
                backdropClass: 'backdropBackground',
            })

            // Check if userUrl is reset when dialog result is false
            expect(mockConfigSvc.userUrl).toBe('')
        })

        it('should not reset userUrl if dialog result is truthy', () => {
            // The shared mock closes with false, which is the reset case; this test is the
            // other branch, so the dialog has to close with a truthy result.
            mockMatDialog.open = jest.fn(() => ({
                afterClosed: jest.fn(() => of(true)),
            })) as any

            const template = {}
            component.applyChanges(template)

            // userUrl should not be reset if dialog result is true
            expect(mockConfigSvc.userUrl).toBe('user-url')
        })
    })

    describe('onItemChange', () => {
        it('should update widgetResolverData url when introVideos is changed', () => {
            component.introVideos = { en: 'video-url', fr: 'french-video-url' }
            component.onItemChange('fr')

            expect(component.widgetResolverData.widgetData.url).toBe('french-video-url')
        })
    })
})
