import { NavigationEnd, NavigationStart } from '@angular/router'
import { Subject } from 'rxjs'

import { RootComponent } from './root.component'

describe('RootComponent', () => {
	let component: RootComponent
	let routerEvents: Subject<any>
	let breadcrumbsService: any
	let eventSvc: any
	let logger: any
	let swUpdate: any
	let changeDetector: any
	let loaderState: Subject<boolean>

	beforeEach(() => {
		routerEvents = new Subject<any>()
		loaderState = new Subject<boolean>()
		breadcrumbsService = { initialize: jest.fn() }
		eventSvc = { dispatchEvent: jest.fn() }
		logger = { log: jest.fn() }
		swUpdate = {
			isEnabled: true,
			checkForUpdate: jest.fn(),
			activateUpdate: jest.fn(),
		}
		changeDetector = { detectChanges: jest.fn() }

		component = new RootComponent(
			{ events: routerEvents, navigate: jest.fn() } as any,   // router
			{ snapshot: { root: { firstChild: null } } } as any,    // route
			{ isStable: new Subject() } as any,                      // appRef
			logger,
			swUpdate,
			{} as any,                                               // configSvc
			{ isXSmall$: new Subject() } as any,                     // valueSvc
			{ impression: jest.fn() } as any,                        // telemetrySvc
			{ init: jest.fn() } as any,                              // mobileAppsSvc
			// ngOnInit pipes off showNavbarDisplay$.
			{ showNavbarDisplay$: new Subject() } as any,            // rootSvc
			breadcrumbsService,
			changeDetector,
			{} as any,                                               // utilitySvc
			eventSvc,
			{} as any,                                               // authSvc
			{ changeLoad: loaderState } as any,                      // loader
		)
	})

	it('should create the component', () => {
		expect(component).toBeTruthy()
	})

	describe('ngOnInit', () => {
		it('should initialise the breadcrumbs and record whether it is framed', () => {
			component.ngOnInit()

			expect(breadcrumbsService.initialize).toHaveBeenCalled()
			// jsdom reports window.self === window.top, so this is never framed here.
			expect(component.isInIframe).toBe(false)
		})

		it('should mark a route change in progress on NavigationStart', () => {
			component.ngOnInit()

			routerEvents.next(new NavigationStart(1, '/app/home'))

			expect(component.routeChangeInProgress).toBe(true)
			expect(component.isNavBarRequired).toBe(true)
			expect(changeDetector.detectChanges).toHaveBeenCalled()
		})

		it('should hide the nav bar for an embedded route', () => {
			component.ngOnInit()

			routerEvents.next(new NavigationStart(1, '/embed/something'))

			expect(component.isNavBarRequired).toBe(false)
		})

		it('should flag the setup pages on NavigationEnd', () => {
			component.ngOnInit()

			routerEvents.next(new NavigationEnd(1, '/app/setup/welcome', '/app/setup/welcome'))

			expect(component.isSetupPage).toBe(true)
		})
	})

	describe('raiseAppStartTelemetry', () => {
		it('should dispatch the app-start event once and only once', () => {
			component.raiseAppStartTelemetry()
			component.raiseAppStartTelemetry()

			expect(eventSvc.dispatchEvent).toHaveBeenCalledTimes(1)
			expect(eventSvc.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ type: 'app', mode: 'view' }),
				})
			)
		})
	})

	describe('initAppUpdateCheck', () => {
		it('should log, and stay out of the way outside production', () => {
			// The six-hourly update poll only runs when environment.production is set, and
			// setup-jest's environment mock leaves it false.
			component.initAppUpdateCheck()

			expect(logger.log).toHaveBeenCalled()
			expect(swUpdate.checkForUpdate).not.toHaveBeenCalled()
		})
	})
})
