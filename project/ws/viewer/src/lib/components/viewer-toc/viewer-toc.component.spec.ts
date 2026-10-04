import { ViewerTocComponent } from './viewer-toc.component'
import { of } from 'rxjs'


describe('ViewerTocComponent', () => {
  let component: ViewerTocComponent
  let mockActivatedRoute: any
  let mockDomSanitizer: any
  let mockWidgetContentService: any
  let mockUtilityService: any
  let mockViewerDataService: any
  let mockConfigService: any
  let mockViewerUtilService: any

  beforeEach(() => {
    // Mock services
    mockActivatedRoute = {
      // ngOnInit reads snapshot.data.hierarchyData / .enrollmentData straight away.
      snapshot: { data: {} },
      queryParamMap: of({
        get: (key: string) => {
          const params: { [key: string]: string } = {
            collectionId: 'test-collection',
            collectionType: 'course',
            primaryCategory: 'Course',
            batchId: '1',
            viewMode: 'START'
          }
          return params[key]
        }
      })
    }

    mockDomSanitizer = {
      bypassSecurityTrustResourceUrl: jest.fn(url => url)
    }

    mockWidgetContentService = {
      // The component reads res.result.content off this response.
      fetchContent: jest.fn().mockReturnValue(of({
        result: {
          content: {
            identifier: 'test-content',
            name: 'Test Content',
            children: [],
            mimeType: 'application/vnd.ekstep.content-collection',
            primaryCategory: 'Course'
          }
        }
      })),
      fetchAuthoringContent: jest.fn().mockReturnValue(of({
        identifier: 'test-content',
        name: 'Test Content',
        children: []
      }))
    }

    mockUtilityService = {
      getLeafNodes: jest.fn().mockReturnValue([]),
      getPath: jest.fn().mockReturnValue([])
    }

    mockViewerDataService = {
      changedSubject: of({}),
      resourceId: 'test-resource',
      updateNextPrevResource: jest.fn(),
      collectionId: 'test-collection'
    }

    mockConfigService = {
      instanceConfig: {
        logos: {
          defaultContent: 'default-logo-url'
        }
      }
    }

    mockViewerUtilService = {
      getContentTypeIcon: jest.fn(),
      getPublicUrl: jest.fn()
    }

    // Initialize component
    // Argument order matters: the 6th parameter is ViewerUtilService and the 7th is
    // ConfigurationsService. Passing the config service 6th put it in the wrong slot, so
    // configSvc.instanceConfig was never visible to the component.
    component = new ViewerTocComponent(
      mockActivatedRoute,
      mockDomSanitizer,
      mockWidgetContentService,
      mockUtilityService,
      mockViewerDataService,
      mockViewerUtilService,
      mockConfigService
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize with default values', async () => {
      await component.ngOnInit()
      expect(component.collectionId).toBe('test-collection')
      expect(component.collectionType).toBe('course')
      expect(component.viewMode).toBe('START')
      expect(component.batchId).toBe('1')
    })

    it('should set default thumbnail from config service', async () => {
      await component.ngOnInit()
      expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('default-logo-url')
    })
  })

  describe('changeTocMode', () => {
    it('should toggle between FLAT and TREE modes', () => {
      // tocMode defaults to 'TREE' in the component.
      expect(component.tocMode).toBe('TREE')
      component.changeTocMode()
      expect(component.tocMode).toBe('FLAT')
      component.changeTocMode()
      expect(component.tocMode).toBe('TREE')
    })
  })

  describe('minimizenav', () => {
    it('should emit false when minimizenav is called', () => {
      const emitSpy = jest.spyOn(component.hidenav, 'emit')
      component.minimizenav()
      expect(emitSpy).toHaveBeenCalledWith(false)
    })
  })


  describe('hasNestedChild', () => {
    it('should return true for nodes with children', () => {
      const node = {
        identifier: 'test',
        children: [{ identifier: 'child' }],
      } as any
      expect(component.hasNestedChild(0, node)).toBeTruthy()
    })

    it('should return false for nodes without children', () => {
      const node = {
        identifier: 'test',
        children: null,
      } as any
      expect(component.hasNestedChild(0, node)).toBeFalsy()
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      const subscription = { unsubscribe: jest.fn() }
      component['paramSubscription'] = subscription as any
      component['viewerDataServiceSubscription'] = subscription as any

      component.ngOnDestroy()

      expect(subscription.unsubscribe).toHaveBeenCalledTimes(2)
    })
  })
})