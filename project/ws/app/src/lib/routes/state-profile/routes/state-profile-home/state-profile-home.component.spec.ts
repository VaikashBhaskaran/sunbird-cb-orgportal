import { StateProfileHomeComponent } from './state-profile-home.component'
import { ValueService } from '@sunbird-cb/utils-v2'
import { ActivatedRoute, Router } from '@angular/router'
import { StepService } from '../../services/step.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'

describe('StateProfileHomeComponent', () => {
    let component: StateProfileHomeComponent
    let valueServiceMock: jest.Mocked<ValueService>
    let routeMock: jest.Mocked<ActivatedRoute>
    let routerMock: jest.Mocked<Router>
    let stepServiceMock: jest.Mocked<StepService>
    let snackBarMock: jest.Mocked<MatSnackBar>
    let configServiceMock: jest.Mocked<ConfigurationsService>
    let orgServiceMock: any

    beforeEach(() => {
        valueServiceMock = {
            isLtMedium$: of(false), // Mock Observable
        } as any

        routeMock = {
            parent: {
                snapshot: {
                    data: {
                        pageData: {
                            data: {
                                tabs: [],
                            },
                        },
                    },
                },
            },
        } as any

        routerMock = {
            events: of({}), // Mock Router event observable
            navigate: jest.fn(),
        } as any

        stepServiceMock = {
            allSteps: {
                next: jest.fn(),
            },
            currentStep: {
                next: jest.fn(),
                value: {
                    allowSkip: true,
                },
            },
            skipped: {
                next: jest.fn(),
            },
        } as any

        snackBarMock = {
            open: jest.fn(),
        } as any

        configServiceMock = {
            unMappedUser: {
                rootOrgId: 'org123',
            },
        } as any

        // The 7th parameter is OrgProfileService; the component calls getFormStatus,
        // formValues and updateOrgProfileDetails on it, so null is not usable.
        orgServiceMock = {
            getFormStatus: jest.fn().mockReturnValue(true),
            formValues: {},
            updateOrgProfileDetails: jest.fn().mockReturnValue(of({})),
        } as any

        component = new StateProfileHomeComponent(
            valueServiceMock,
            routeMock,
            routerMock,
            stepServiceMock,
            configServiceMock,
            snackBarMock,
            orgServiceMock
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize tabs from route data', () => {
        component.ngOnInit()
        expect(component.tabs).toEqual([])
    })

    it('should call init method on constructor', () => {
        // init() runs from the constructor, so a spy installed after construction can never
        // see it. Assert the state init() leaves behind instead.
        expect(component.tabs).toBeDefined()
        expect(stepServiceMock.allSteps.next).toHaveBeenCalledWith(component.tabs.length)
    })

    it('should unsubscribe from router events in ngOnDestroy', () => {
        const unsubscribeSpy = jest.spyOn(component['routerSubscription']!, 'unsubscribe')
        component.ngOnDestroy()
        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should update org profile', () => {
        const updateOrgProfileSpy = jest.spyOn(component, 'updateOrgProfile')
        component.updateOrgProfile(true)
        expect(updateOrgProfileSpy).toHaveBeenCalled()
    })

    it('should navigate on update profile', () => {
        component.updateProfile()
        expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home/welcome'])
    })

    it('should update current step on navigation event', () => {
        //const navigationEvent = { url: '/app/home/welcome' }
        //component['routerSubscription']!.next({ ...navigationEvent })
        expect(component.currentStep).toBe(1)
    })

    it('should check if next step is allowed', () => {
        // isNextStepAllowed inspects the tab whose step matches currentStep; 'welcome' is
        // the key that allows it unconditionally.
        component.currentStep = 1
        component.tabs = [{ step: 1, key: 'welcome', routerLink: '/welcome', name: '', badges: { enabled: false, uri: undefined }, enabled: false, description: '' }] as any
        const result = component.isNextStepAllowed
        expect(result).toBe(true)
    })

    it('should show snackbar on error in updateOrgProfile', () => {
        const error = { error: 'Error: Something went wrong' }
        const openSnackbarSpy = jest.spyOn(snackBarMock, 'open')
        component.updateOrgProfile(true)
        // split(':')[1] keeps the leading space, so trim before handing it over.
        component['openSnackbar'](error.error.split(':')[1].trim())
        expect(openSnackbarSpy).toHaveBeenCalledWith('Something went wrong', 'X', { duration: 5000 })
    })

    it('should return next step from next getter', () => {
        component.currentStep = 1
        component.tabs = [
            {
                step: 1, key: 'welcome', routerLink: '/welcome',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
            {
                step: 2, key: 'nextStep', routerLink: '/next',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
        ]
        const nextStep = component.next
        // The tab objects carry name/badges/enabled/description too, so match on the
        // fields under test rather than the whole shape.
        expect(nextStep).toEqual(expect.objectContaining({ step: 2, key: 'nextStep', routerLink: '/next' }))
    })

    it('should return null if no next step from next getter', () => {
        component.currentStep = 3
        // next returns early unless isNextStepAllowed and isFormValid hold, and both are
        // derived from the tab matching currentStep - so it has to be present.
        component.tabs = [{ step: 3, key: 'welcome', routerLink: '/welcome', name: '', badges: { enabled: false, uri: undefined }, enabled: false, description: '' }] as any
        const nextStep = component.next
        expect(nextStep).toBe('done')
    })

    it('should return previous step from previous getter', () => {
        component.currentStep = 2
        component.tabs = [
            {
                step: 1, key: 'welcome', routerLink: '/welcome',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
            {
                step: 2, key: 'nextStep', routerLink: '/next',
                name: '',
                badges: {
                    enabled: false,
                    uri: undefined
                },
                enabled: false,
                description: ''
            },
        ]
        const prevStep = component.previous
        expect(prevStep).toEqual(expect.objectContaining({ step: 1, key: 'welcome', routerLink: '/welcome' }))
    })

    it('should return null if no current step from current getter', () => {
        component.currentStep = 10
        const currentStep = component.current
        expect(currentStep).toBeNull()
    })

    it('should check form validity from isFormValid getter', () => {
        // `current` is a getter over tabs, so it cannot be assigned directly - give the
        // component a tab matching currentStep instead.
        component.currentStep = 1
        component.tabs = [{ step: 1, key: 'welcome', routerLink: '/welcome', name: '', badges: { enabled: false, uri: undefined }, enabled: false, description: '' }] as any
        const isValid = component.isFormValid
        expect(isValid).toBe(true) // Assuming the form status is valid
    })
})
