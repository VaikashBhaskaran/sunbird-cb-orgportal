import { MyNotificationsComponent } from './my-notifications.component'
import { Router } from '@angular/router'

describe('MyNotificationsComponent', () => {
  let component: MyNotificationsComponent
  let mockRouter: jest.Mocked<Router>
  let mockEvents: any
  let mockConfigSvc: any
  let mockNotificationsService: any
  let mockSnackBar: any

  beforeEach(() => {
    // Create mock router
    mockRouter = {
      navigate: jest.fn()
    } as any

    // The component gained four more dependencies; these are inert stand-ins covering
    // only what it actually calls on them.
    mockEvents = { raiseInteractTelemetry: jest.fn() } as any
    mockConfigSvc = { unMappedUser: { roles: ['MDO_ADMIN'] } } as any
    mockNotificationsService = { handleRedirection: jest.fn() } as any
    mockSnackBar = { open: jest.fn() } as any

    // Create component instance
    component = new MyNotificationsComponent(
      mockRouter,
      mockEvents,
      mockConfigSvc,
      mockNotificationsService,
      mockSnackBar,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should inject router dependency', () => {
      expect(mockRouter).toBeDefined()
    })
  })

  describe('redirectTo method', () => {
    describe('when notification has category', () => {
      // redirectTo no longer decides the destination itself. For a categorised
      // notification it raises telemetry and hands the notification, environment, roles
      // and snackbar to NotificationsService.handleRedirection, which does the routing.
      it('should raise telemetry and delegate to the notifications service', () => {
        const notification = {
          category: 'PROFILE',
          notification_id: '123',
          message: 'Profile update notification'
        }

        component.redirectTo(notification)

        expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
          { type: 'click', subType: 'notification-engine', id: '123' },
          {},
          { module: 'Home' }
        )
        expect(mockNotificationsService.handleRedirection).toHaveBeenCalledWith(
          notification,
          component.environment,
          component.roles,
          mockSnackBar
        )
        expect(mockRouter.navigate).not.toHaveBeenCalled()
      })

      it('should delegate for any category, not just PROFILE', () => {
        const testCategories = ['EVENT', 'TASK', 'MESSAGE', 'ALERT', 'UPDATE']

        testCategories.forEach(category => {
          component.redirectTo({ category, notification_id: '999' })
        })

        expect(mockNotificationsService.handleRedirection)
          .toHaveBeenCalledTimes(testCategories.length)
        expect(mockRouter.navigate).not.toHaveBeenCalled()
      })
    })

    describe('when notification has no category', () => {
      it('should navigate to notifications with query params when category is undefined', () => {
        const notification = {
          id: '123',
          message: 'No category notification',
          type: 'info'
        }

        component.redirectTo(notification)

        expect(mockRouter.navigate).toHaveBeenCalledWith(
          ['/app/home/notifications'],
          { queryParams: { tab: notification } }
        )
        expect(mockRouter.navigate).toHaveBeenCalledTimes(1)
      })

      it('should navigate to notifications with query params when category is null', () => {
        const notification = {
          category: null,
          id: '456',
          message: 'Null category notification'
        }

        component.redirectTo(notification)

        expect(mockRouter.navigate).toHaveBeenCalledWith(
          ['/app/home/notifications'],
          { queryParams: { tab: notification } }
        )
        expect(mockRouter.navigate).toHaveBeenCalledTimes(1)
      })

      it('should pass entire notification object as tab query parameter', () => {
        const notification = {
          id: '789',
          message: 'Complex notification',
          timestamp: '2024-01-01T10:00:00Z',
          read: false,
          priority: 'high',
          metadata: {
            source: 'system',
            type: 'alert'
          }
        }

        component.redirectTo(notification)

        expect(mockRouter.navigate).toHaveBeenCalledWith(
          ['/app/home/notifications'],
          { queryParams: { tab: notification } }
        )
      })
    })

    describe('router navigation verification', () => {
      it('should call router.navigate exactly once for an uncategorised notification', () => {
        component.redirectTo({ id: '1' })

        expect(mockRouter.navigate).toHaveBeenCalledTimes(1)
      })

      it('should navigate once per call', () => {
        const notification = { id: '2' }

        component.redirectTo(notification)
        component.redirectTo(notification)

        expect(mockRouter.navigate).toHaveBeenCalledTimes(2)
        expect(mockRouter.navigate).toHaveBeenNthCalledWith(
          1, ['/app/home/notifications'], { queryParams: { tab: notification } })
        expect(mockRouter.navigate).toHaveBeenNthCalledWith(
          2, ['/app/home/notifications'], { queryParams: { tab: notification } })
      })

      it('should let router navigation errors surface', () => {
        mockRouter.navigate.mockImplementation(() => {
          throw new Error('Navigation failed')
        })

        expect(() => component.redirectTo({ id: '3' })).toThrow('Navigation failed')
      })
    })
  })

  describe('component structure', () => {
    it('should have correct selector', () => {
      // This would typically be tested in integration tests, but we can verify the component metadata
      expect(MyNotificationsComponent).toBeDefined()
    })

    it('should take the router plus its four collaborators', () => {
      // Router, EventService, ConfigurationsService, NotificationsService, MatSnackBar.
      expect(MyNotificationsComponent.length).toBe(5)
    })
  })
})