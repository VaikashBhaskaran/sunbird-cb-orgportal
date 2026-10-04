import { SimpleChanges, SimpleChange } from '@angular/core'
import { WebModuleComponent } from './web-module.component'
import { DomSanitizer } from '@angular/platform-browser'
import { ValueService, ConfigurationsService } from '@sunbird-cb/utils'
import { WidgetContentService } from '@sunbird-cb/toc'
import { ViewerUtilService } from '../../viewer-util.service'
import { EventService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

describe('WebModuleComponent', () => {
  let component: WebModuleComponent
  let mockDomSanitizer: jest.Mocked<DomSanitizer>
  let mockValueService: jest.Mocked<ValueService>
  let mockContentService: jest.Mocked<WidgetContentService>
  let mockViewerService: jest.Mocked<ViewerUtilService>
  let mockConfigService: jest.Mocked<ConfigurationsService>
  let mockEventService: jest.Mocked<EventService>
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>

  beforeEach(() => {
    mockDomSanitizer = {
      bypassSecurityTrustResourceUrl: jest.fn(url => url),
      bypassSecurityTrustUrl: jest.fn(url => url),
    } as any

    mockValueService = {
      isXSmall$: of(false),
    } as any

    mockContentService = {
      saveContinueLearning: jest.fn().mockReturnValue(of({})),
    } as any

    mockViewerService = {
      realTimeProgressUpdate: jest.fn(),
    } as any

    mockConfigService = {
      activeFontObject: { baseFontSize: '14px' },
      prefChangeNotifier: of({}),
    } as any

    mockEventService = {
      raiseInteractTelemetry: jest.fn(),
    } as any

    mockActivatedRoute = {
      snapshot: {
        queryParams: {},
      },
    } as any

    component = new WebModuleComponent(
      mockEventService,
      mockDomSanitizer,
      mockValueService,
      mockContentService as any,   // a partial double
      mockViewerService,
      mockConfigService,
      mockActivatedRoute,
    )

    // Setup default test data
    component.widgetData = {
      identifier: 'test-id',
      artifactUrl: 'http://test.com/content/index.html',
      mimeType: 'application/web-module',
    }

    component.webModuleManifest = {
      resources: [
        {
          artifactUrl: '/slide1.html',
          title: 'Slide 1',
        },
        {
          artifactUrl: '/slide2.html',
          title: 'Slide 2',
        },
      ],
    }
  })

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
      expect(component.currentSlideNumber).toBe(0)
      expect(component.maxLastPageNumber).toBe(0)
      expect(component.defaultFontSize).toBe(14)
    })

    it('should subscribe to screen size changes on init', () => {
      component.ngOnInit()
      expect(component.screenSizeIsXSmall).toBe(false)
    })
  })

  describe('loadWebModule', () => {
    it('should load slides from manifest resources', () => {
      component.loadWebModule()
      expect(component.slides.length).toBe(2)
      expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalled()
    })

    it('should handle manifest without resources property', () => {
      component.webModuleManifest = [
        {
          URL: '/slide1.html',
          title: 'Slide 1',
        },
      ]
      component.loadWebModule()
      expect(component.slides.length).toBe(1)
    })
  })

  describe('setPage', () => {
    beforeEach(() => {
      component.loadWebModule()
    })


    it('should not change page if number is out of range', () => {
      const result = component.setPage(999)
      expect(result).toBe(1)
    })

    it('should mark as completed when reaching last slide', () => {
      component.setPage(2) // Last slide in our test data
      expect(component.isCompleted).toBe(true)
    })
  })

  describe('pageChange', () => {
    beforeEach(() => {
      component.loadWebModule()
      component.setPage(1)
    })

    it('should increment page when going forward', () => {
      component.pageChange(1)
      expect(component.currentSlideNumber).toBe(2)
    })

    it('should decrement page when going backward', () => {
      component.setPage(2)
      component.pageChange(-1)
      expect(component.currentSlideNumber).toBe(1)
    })

    it('should not go beyond last page', () => {
      component.setPage(2)
      component.pageChange(1)
      expect(component.currentSlideNumber).toBe(2)
    })

    it('should not go before first page', () => {
      component.setPage(1)
      component.pageChange(-1)
      expect(component.currentSlideNumber).toBe(1)
    })
  })

  describe('ngOnChanges', () => {
    it('should handle widget data changes', () => {
      const changes: SimpleChanges = {
        widgetData: new SimpleChange(
          { identifier: 'old-id' },
          { identifier: 'new-id', artifactUrl: 'http://test.com/content/index.html' },
          false
        ),
      }
      component.ngOnChanges(changes)
      expect(component.oldIdentifier).toBe('test-id')
    })
  })

  describe('fireRealTimeProgress', () => {
    it('should call realTimeProgressUpdate when conditions are met', () => {
      component.current = ['1']
      component.slides = [{ title: 'Test', URL: 'test.html' }]
      component.fireRealTimeProgress('test-id')
      expect(mockViewerService.realTimeProgressUpdate).toHaveBeenCalled()
    })

    it('should not call realTimeProgressUpdate when current is empty', () => {
      component.current = []
      component.fireRealTimeProgress('test-id')
      expect(mockViewerService.realTimeProgressUpdate).not.toHaveBeenCalled()
    })
  })

  describe('saveContinueLearning', () => {
    it('should save progress for playlist type', () => {
      mockActivatedRoute.snapshot.queryParams = {
        collectionType: 'playlist',
        collectionId: 'test-collection'
      }
      component.saveContinueLearning('test-id')
      expect(mockContentService.saveContinueLearning).toHaveBeenCalled()
    })

    it('should save progress for non-playlist type', () => {
      mockActivatedRoute.snapshot.queryParams = {}
      component.saveContinueLearning('test-id')
      expect(mockContentService.saveContinueLearning).toHaveBeenCalled()
    })
  })

  describe('raiseTelemetry', () => {
    it('should raise telemetry event with correct parameters', () => {
      component.raiseTelemetry('test-action', 'test-event')
      expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalledWith(
        'test-action',
        'test-event',
        expect.any(Object)
      )
    })

    it('should reset isScrolled flag when event is scroll', () => {
      component.isScrolled = true
      component.raiseTelemetry('test-action', 'scroll')
      expect(component.isScrolled).toBe(false)
    })
  })

  describe('setPage method edge cases', () => {
    beforeEach(() => {
      component.loadWebModule()
      component.current = []
    })

    it('should add page number to current array if not already included', () => {
      const pageNumber = 1
      expect(component.current).not.toContain(pageNumber.toString())

      component.setPage(pageNumber)

      expect(component.current).toContain(pageNumber.toString())
      expect(component.current.length).toBe(1)
    })

    it('should not add duplicate page numbers to current array', () => {
      const pageNumber = 1
      // First addition
      component.setPage(pageNumber)
      expect(component.current.length).toBe(1)

      // Second attempt to add same page
      component.setPage(pageNumber)
      expect(component.current.length).toBe(1)
      expect(component.current).toEqual([pageNumber.toString()])
    })

    it('should return null if iframeUrl exists and pageNumber equals currentSlideNumber', () => {
      // First set a page to establish iframeUrl and currentSlideNumber
      component.setPage(1)
      component.iframeUrl = 'http://test.com/slide1'
      component.currentSlideNumber = 1

      // Try to set the same page again
      const result = component.setPage(1)

      expect(result).toBeNull()
    })

    it('should proceed with page change if iframeUrl exists but pageNumber is different', () => {
      // First set a page
      component.setPage(1)
      component.iframeUrl = 'http://test.com/slide1'
      component.currentSlideNumber = 1

      // Set a different page
      const result = component.setPage(2)

      expect(result).toBe(2)
      expect(component.currentSlideNumber).toBe(2)
    })

    it('should proceed with page change if iframeUrl is empty', () => {
      component.iframeUrl = ''
      component.currentSlideNumber = 1

      const result = component.setPage(2)

      expect(result).toBe(2)
      expect(component.currentSlideNumber).toBe(2)
    })

    it('should handle multiple page changes and maintain correct current array', () => {
      // Set multiple pages in sequence
      component.setPage(1)
      component.setPage(2)
      component.setPage(1) // Returning to page 1

      expect(component.current.length).toBe(2)
      expect(component.current).toEqual(['1', '2'])
    })
  })
})