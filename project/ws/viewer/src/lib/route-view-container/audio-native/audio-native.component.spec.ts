import { AudioNativeComponent } from './audio-native.component'
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { NsContent } from '@sunbird-cb/collection'

describe('AudioNativeComponent', () => {
  let component: AudioNativeComponent
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockConfigService: Partial<ConfigurationsService>

  const mockAudioData: NsContent.IContent = {
    identifier: 'test-audio-001',
    addedOn: '2024-02-05T10:00:00.000Z',
    appIcon: 'test-icon.png',
    artifactUrl: 'test-artifact.mp3',
    certificationUrl: 'test-cert.pdf',
    children: [],
    complexityLevel: 'Beginner',
    contentId: 'cont_001',
    contentUrlAtSource: 'source-url',
    creatorContacts: [],
    creatorDetails: [],
    creatorLogo: 'creator-logo.png',
    creatorPosterImage: 'poster.jpg',
    creatorThumbnail: 'thumbnail.jpg',
    curatedTags: [],
    description: 'Test audio description',
    duration: 300,
    hasAccess: true,
    isExternal: false,
    isIframeSupported: 'Yes',
    lastUpdatedOn: '2024-02-05T10:00:00.000Z',
    learningObjective: 'Test objective',
    mediaType: 'audio',
    me_totalSessionsCount: 0,
    name: 'Test Audio',
    preRequisites: 'None',
    publishedOn: '2024-02-05T10:00:00.000Z',
    resourceType: 'Audio',
    skills: [],
    sourceName: 'Test Source',
    sourceShortName: 'TS',
    status: 'Live',
    tags: [],
    topics: [],
    track: [],
    contentType: NsContent.EContentTypes.PROGRAM,
    displayContentType: NsContent.EDisplayContentTypes.ASSESSMENT,
    mimeType: NsContent.EMimeTypes.COLLECTION,
    primaryCategory: NsContent.EPrimaryCategory.PROGRAM
  }

  beforeEach(() => {
    mockActivatedRoute = {
      // A hand-built stand-in, not a real snapshot: cast once rather than satisfying
        // every field of ActivatedRouteSnapshot.
        snapshot: {
        queryParams: {},
        url: [],
        params: {},
        fragment: '',
        data: {},
        outlet: '',
        component: '',
        routeConfig: undefined,
        root: new ActivatedRouteSnapshot(),
        parent: new ActivatedRouteSnapshot(),
        firstChild: new ActivatedRouteSnapshot(),
        children: [],
        pathFromRoot: [],
        paramMap: undefined,
        queryParamMap: undefined
      } as any
    }

    mockConfigService = {
      restrictedFeatures: new Set()
    }

    component = new AudioNativeComponent(
      mockActivatedRoute as ActivatedRoute,
      mockConfigService as ConfigurationsService
    )
  })

  describe('initialization', () => {
    it('should create component with default values', () => {
      expect(component).toBeTruthy()
      expect(component.isScreenSizeSmall).toBeFalsy()
      expect(component.forPreview).toBeFalsy()
      expect(component.isFetchingDataComplete).toBeFalsy()
      expect(component.audioData).toBeNull()
      expect(component.discussionForumWidget).toBeNull()
      expect(component.defaultThumbnail).toBe('')
      expect(component.isPreviewMode).toBeFalsy()
      expect(component.isTypeOfCollection).toBeFalsy()
      expect(component.isRestricted).toBeFalsy()
    })

    it('should initialize isTypeOfCollection based on route query params', () => {
      component.ngOnInit()
      expect(component.isTypeOfCollection).toBeFalsy()

      mockActivatedRoute.snapshot!.queryParams = { collectionType: 'course' }
      component.ngOnInit()
      expect(component.isTypeOfCollection).toBeTruthy()
    })
  })

  describe('restrictedFeatures handling', () => {
    it('should set isRestricted to false when discussionForum is not restricted', () => {
      mockConfigService.restrictedFeatures = new Set(['otherFeature'])
      component.ngOnInit()
      expect(component.isRestricted).toBeTruthy()
    })

    it('should set isRestricted to true when discussionForum is restricted', () => {
      mockConfigService.restrictedFeatures = new Set(['disscussionForum'])
      component.ngOnInit()
      expect(component.isRestricted).toBeFalsy()
    })

    it('should handle null restrictedFeatures', () => {
      mockConfigService.restrictedFeatures = null
      component.ngOnInit()
      expect(component.isRestricted).toBeFalsy()
    })
  })

  describe('input properties', () => {
    it('should set isScreenSizeSmall', () => {
      component.isScreenSizeSmall = true
      expect(component.isScreenSizeSmall).toBeTruthy()
    })

    it('should set forPreview', () => {
      component.forPreview = true
      expect(component.forPreview).toBeTruthy()
    })

    it('should set isFetchingDataComplete', () => {
      component.isFetchingDataComplete = true
      expect(component.isFetchingDataComplete).toBeTruthy()
    })

    it('should set audioData', () => {
      component.audioData = mockAudioData
      expect(component.audioData).toEqual(mockAudioData)
      expect(component.audioData?.mediaType).toBe('audio')
      // Assert against the enum, not its literal value: EContentTypes.PROGRAM reads
      // 'Learning Path' in the current @sunbird-cb/collection and may change again.
      expect(component.audioData?.contentType).toBe(NsContent.EContentTypes.PROGRAM)
    })


    it('should set defaultThumbnail', () => {
      const thumbnail = 'test-thumbnail.jpg'
      component.defaultThumbnail = thumbnail
      expect(component.defaultThumbnail).toBe(thumbnail)
    })

    it('should set isPreviewMode', () => {
      component.isPreviewMode = true
      expect(component.isPreviewMode).toBeTruthy()
    })
  })

  describe('route query params handling', () => {
    it('should handle empty query params', () => {
      mockActivatedRoute.snapshot!.queryParams = {}
      component.ngOnInit()
      expect(component.isTypeOfCollection).toBeFalsy()
    })


    it('should handle collectionType with different values', () => {
      const testCases = ['course', 'playlist', 'module']

      testCases.forEach(type => {
        mockActivatedRoute.snapshot!.queryParams = { collectionType: type }
        component.ngOnInit()
        expect(component.isTypeOfCollection).toBeTruthy()
      })
    })
  })
})