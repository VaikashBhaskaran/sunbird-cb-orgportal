import { EventsListComponent } from './events-list.component'
import { EventsService } from '../../services/events.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router, UrlSegment, ActivatedRouteSnapshot, ParamMap } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'

describe('EventsListComponent', () => {
  let component: EventsListComponent
  let mockEventService: jest.Mocked<EventsService>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockRouter: jest.Mocked<Router>
  let mockDialog: jest.Mocked<MatDialog>
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockActivatedRouteSnapshot: Partial<ActivatedRouteSnapshot>

  beforeEach(() => {
    // Setup EventService mock with default response
    mockEventService = {
      getEvents: jest.fn().mockReturnValue(of({ Event: [], count: 0 })),
      updateEvent: jest.fn().mockReturnValue(of({})),
      // The component subscribes to the cancel call.
      cancelEvent: jest.fn().mockReturnValue(of({}))
    } as any

    mockSnackBar = {
      open: jest.fn()
    } as any

    mockRouter = {
      navigate: jest.fn()
    } as any

    mockDialog = {
      open: jest.fn()
    } as any

    const mockUrlSegment = new UrlSegment('upcoming', {})

    mockActivatedRouteSnapshot = {
      url: [mockUrlSegment],
      params: {},
      queryParams: {},
      fragment: null,
      data: {},
      outlet: 'primary',
      component: null,
      routeConfig: null,
      root: null as any,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [],
      paramMap: {
        get: () => null,
        has: () => false,
        getAll: () => [],
        keys: []
      } as ParamMap,
      queryParamMap: {
        get: () => null,
        has: () => false,
        getAll: () => [],
        keys: []
      } as ParamMap
    }

    mockActivatedRoute = {
      snapshot: mockActivatedRouteSnapshot as ActivatedRouteSnapshot
    }

    component = new EventsListComponent(
      mockEventService,
      mockSnackBar,
      mockActivatedRoute as ActivatedRoute,
      mockRouter,
      mockDialog
    )
  })

  describe('initialization', () => {
    it('should initialize with correct table data for upcoming events', () => {
      // Setup mock response for getEvents
      mockEventService.getEvents.mockReturnValue(of({ Event: [], count: 0 }))

      component.ngOnInit()

      expect(component.tableData.columns).toHaveLength(4)
      expect(component.tableData.columns[0].displayName).toBe('Event Name')
      // The upcoming tab offers View, Edit and Cancel.
      expect(component.menuItems).toHaveLength(3)
      expect(component.pathUrl).toBe('upcoming')
    })

    it('should initialize with correct table data for draft events', () => {
      // Setup mock response for getEvents
      mockEventService.getEvents.mockReturnValue(of({ Event: [], count: 0 }))

      const draftUrlSegment = new UrlSegment('draft', {})
      mockActivatedRouteSnapshot.url = [draftUrlSegment]
      mockActivatedRoute.snapshot = mockActivatedRouteSnapshot as ActivatedRouteSnapshot

      component.ngOnInit()

      expect(component.tableData.columns).toHaveLength(4)
      expect(component.menuItems).toHaveLength(3)
      expect(component.pathUrl).toBe('draft')
    })
  })

  describe('getEvents', () => {
    it('should fetch events successfully', () => {
      const mockResponse = {
        Event: [{ id: 1, name: 'Test Event' }],
        count: 1
      }

      mockEventService.getEvents.mockReturnValue(of(mockResponse))

      component.ngOnInit()

      expect(component.eventsList).toEqual(mockResponse.Event)
      expect(component.paginationDetails.totalCount).toBe(1)
      expect(component.showEventsLoader).toBeFalsy()
    })

    it('should handle error when fetching events', () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Some thing went wrong' }, // Match the exact error message from component
        status: 404
      })

      mockEventService.getEvents.mockReturnValue(throwError(() => errorResponse))

      component.ngOnInit()

      expect(component.showEventsLoader).toBeFalsy()
      expect(mockSnackBar.open).toHaveBeenCalledWith('Some thing went wrong')
    })
  })

  describe('search and pagination', () => {
    it('should update search key and fetch events', () => {
      const searchKey = 'test search'
      mockEventService.getEvents.mockReturnValue(of({ Event: [], count: 0 }))

      component.searchEvents(searchKey)

      expect(component.searchKey).toBe(searchKey)
      expect(mockEventService.getEvents).toHaveBeenCalled()
    })

    it('should update pagination and fetch events', () => {
      const newPagination = {
        startIndex: 20,
        lastIndex: 40,
        pageSize: 20,
        pageIndex: 1,
        totalCount: 100
      }
      mockEventService.getEvents.mockReturnValue(of({ Event: [], count: 0 }))

      component.onPageChange(newPagination)

      expect(component.paginationDetails).toEqual(newPagination)
      expect(mockEventService.getEvents).toHaveBeenCalled()
    })
  })

  describe('event actions', () => {
    it('should navigate to edit event page', () => {
      const eventId = 'test-id'
      const openMode = 'view'

      component.navigateToEditEvent(eventId, openMode)

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/home/events/edit-event', eventId],
        {
          queryParams: {
            mode: openMode,
            pathUrl: component.pathUrl
          }
        }
      )
    })

    it('should cancel event successfully', () => {
      const mockEvent = {
        identifier: 'test-id',
        versionKey: 'v1'
      }
      mockEventService.cancelEvent.mockReturnValue(of({ success: true }))

      component.cancelEvent(mockEvent)

      // The component calls cancelEvent(identifier, requestBody) - not updateEvent, and the
      // identifier comes first. cancelledOn is stamped from the clock, so it is matched
      // loosely rather than pinned to a fixed timestamp.
      expect(mockEventService.cancelEvent).toHaveBeenCalledWith(
        mockEvent.identifier,
        {
          request: {
            event: {
              cancelledBy: '',
              cancelledByName: '',
              cancelledOn: expect.any(String),
              identifier: mockEvent.identifier,
              versionKey: mockEvent.versionKey,
              status: 'Cancelled'
            }
          }
        }
      )
      expect(mockSnackBar.open).toHaveBeenCalledWith('event is cancelled successfully')
    })

    it('should handle event cancellation error', () => {
      const mockEvent = {
        identifier: 'test-id',
        versionKey: 'v1'
      }
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Something went wrong please try again' }, // Match the exact error message from component
        status: 404
      })

      mockEventService.cancelEvent.mockReturnValue(throwError(() => errorResponse))

      component.cancelEvent(mockEvent)

      expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong please try again')
    })
  })

  describe('cleanup', () => {
    it('should unsubscribe from getEventSubscription on destroy', () => {
      const mockUnsubscribe = jest.fn()
      component.getEventSubscription = { unsubscribe: mockUnsubscribe } as any

      component.ngOnDestroy()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})