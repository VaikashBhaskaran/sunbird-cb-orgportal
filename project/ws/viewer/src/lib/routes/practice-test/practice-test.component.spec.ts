import { PracticeTestComponent } from './practice-test.component'
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap } from '@angular/router'
import { EventService, LoggerService, WsEvents } from '@sunbird-cb/utils'
import { ViewerUtilService } from '../../viewer-util.service'
import { MatDialog } from '@angular/material/dialog'
import { EMPTY, of } from 'rxjs'
import { NsContent } from '@sunbird-cb/collection'
import { ViewerPreviewPopupComponent } from '../../viewer-preview-popup/viewer-preview-popup.component'
import { AccessControlService } from '@sunbird-cb/toc'

describe('PracticeTestComponent', () => {
  let component: PracticeTestComponent
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockAccessControlService: jest.Mocked<AccessControlService>
  let mockViewerUtilService: jest.Mocked<ViewerUtilService>
  let mockEventService: jest.Mocked<EventService>
  let mockLoggerService: jest.Mocked<LoggerService>
  let mockMatDialog: jest.Mocked<MatDialog>

  const mockTestData: NsContent.IContent = {
    identifier: 'test-id',
    maxQuestions: 10,
    allowSkip: 'Yes',
    requiresSubmit: 'Yes',
    expectedDuration: 300,
    artifactUrl: 'test-url',
    mimeType: NsContent.EMimeTypes.PDF,
  } as unknown as NsContent.IContent

  beforeEach(() => {
    // Setup mocks with proper param maps
    mockActivatedRoute = {
      // A hand-built stand-in, not a real snapshot: cast once rather than satisfying
        // every field of ActivatedRouteSnapshot.
        snapshot: {
        paramMap: convertToParamMap({ resourceId: 'test-resource' }),
        queryParamMap: convertToParamMap({
          preview: 'false',
          batchId: 'test-batch'
        }),
        url: [],
        params: {},
        queryParams: {},
        fragment: '',
        data: {},
        outlet: '',
        component: '',
        routeConfig: undefined,
        root: new ActivatedRouteSnapshot,
        parent: new ActivatedRouteSnapshot,
        firstChild: new ActivatedRouteSnapshot,
        children: [],
        pathFromRoot: []
      } as any,
      data: of({ content: { data: mockTestData } }),
    }

    mockAccessControlService = {
      authoringConfig: {
        newDesign: false,
      },
    } as any

    mockViewerUtilService = {
      getContent: jest.fn().mockReturnValue(of(mockTestData)),
    } as any

    mockEventService = {
      dispatchEvent: jest.fn(),
    } as any

    mockLoggerService = {
      error: jest.fn(),
    } as any

    mockMatDialog = {
      open: jest.fn(),
    } as any

    // Create component instance
    component = new PracticeTestComponent(
      mockMatDialog,
      mockActivatedRoute as ActivatedRoute,
      mockAccessControlService,
      mockViewerUtilService,
      mockEventService,
      // WidgetContentService sits between EventService and LoggerService, and Router was
      // added after it; neither existed when this spec was written.
      { fetchContent: jest.fn() } as any,
      mockLoggerService,
      { navigate: jest.fn(), events: EMPTY } as any
    )

    // Mock window.location for preview mode detection
    delete (window as any).location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://test.com',
      },
      writable: true,
      configurable: true
    })

    // Mock setTimeout
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
      expect(component.isPreviewMode).toBeFalsy()
      expect(component.isFetchingDataComplete).toBeFalsy()
      expect(component.testData).toBeNull()
      // batchId is now properly initialized from queryParamMap
      expect(component.batchId).toBe('test-batch')
    })

    it('should initialize quiz JSON with default values', () => {
      expect(component.quizJson).toEqual({
        timeLimit: 300,
        questions: [],
        isAssessment: false,
        allowSkip: 'No',
        maxQuestions: 0,
        requiresSubmit: 'Yes',
        showTimer: 'Yes',
      })
    })
  })

  describe('ngOnInit', () => {
    it('should handle preview mode initialization', () => {
      // Set preview mode query param
      const previewRoute = {
        ...mockActivatedRoute,
        snapshot: {
          ...mockActivatedRoute.snapshot,
          queryParamMap: convertToParamMap({ preview: 'true' })
        }
      }

      component = new PracticeTestComponent(
        mockMatDialog,
        previewRoute as ActivatedRoute,
        mockAccessControlService,
        mockViewerUtilService,
        mockEventService,
        { fetchContent: jest.fn() } as any,
        mockLoggerService,
        { navigate: jest.fn(), events: EMPTY } as any
      )

      component.ngOnInit()
      expect(component.isPreviewMode).toBeTruthy()
      expect(mockViewerUtilService.getContent).toHaveBeenCalledWith('test-resource')
    })

    it('should handle normal mode initialization', () => {
      component.ngOnInit()
      expect(component.isPreviewMode).toBeTruthy()
      expect(component.testData).toEqual(mockTestData)
    })
  })

  describe('init', () => {
    it('should initialize quiz data from test data', () => {
      component.testData = mockTestData
      component.init()

      expect(component.quizJson.maxQuestions).toBe(mockTestData.maxQuestions)
      expect(component.quizJson.allowSkip).toBe(mockTestData.allowSkip)
      expect(component.quizJson.requiresSubmit).toBe(mockTestData.requiresSubmit)
      expect(component.quizJson.timeLimit).toBe(mockTestData.expectedDuration)
    })

    it('should set fetchingDataComplete after timeout', () => {
      component.testData = mockTestData
      component.init()

      jest.runAllTimers()

      // The openPreviewPopup() call inside that timeout is commented out in the
      // component, so init no longer opens the preview dialog.
      expect(component.isFetchingDataComplete).toBeTruthy()
      expect(mockMatDialog.open).not.toHaveBeenCalled()
    })

    it('should open the preview popup when asked directly', () => {
      component.testData = mockTestData

      component.openPreviewPopup()

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        ViewerPreviewPopupComponent,
        expect.any(Object)
      )
    })
  })



  describe('ngOnDestroy', () => {
    it('should raise unload event if test data exists', () => {
      component.testData = mockTestData
      component.ngOnDestroy()

      expect(mockEventService.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: WsEvents.EnumTelemetrySubType.Unloaded,
          }),
        })
      )
    })

    it('should unsubscribe from all subscriptions', () => {
      const mockSubscription = {
        unsubscribe: jest.fn(),
      }

      component['dataSubscription'] = mockSubscription as any
      component['viewerDataSubscription'] = mockSubscription as any
      component['telemetryIntervalSubscription'] = mockSubscription as any

      component.ngOnDestroy()

      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(3)
    })
  })
})