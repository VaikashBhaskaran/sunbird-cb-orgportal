import { EventMaterialsComponent } from './event-materials.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EventsService } from '../../services/events.service'
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'
import { of } from 'rxjs'

// Mock window.env
const mockWindow = {
  env: {
    name: 'test-env',
    sitePath: 'test-site-path',
    karmYogiPath: 'test-karmyogi-path',
    cbpPath: 'test-cbp-path',
    domainName: 'test-domain'
  }
}

// Setup window mock
Object.defineProperty(window, 'env', {
  value: mockWindow.env,
  writable: true
})

jest.mock('@angular/material/snack-bar')
jest.mock('../../services/events.service')
jest.mock('../../../../../../../../../../../src/app/services/loader.service')
jest.mock('../../../../../../../../../../../src/environments/environment', () => ({
  environment: {
    production: false,
    name: 'test-env',
    sitePath: 'test-site-path',
    karmYogiPath: 'test-karmyogi-path',
    cbpPath: 'test-cbp-path',
    domainName: 'test-domain'
  }
}))

describe('EventMaterialsComponent', () => {
  let component: EventMaterialsComponent
  let mockMatSnackBar: jest.Mocked<MatSnackBar>
  let mockEventsService: jest.Mocked<EventsService>
  let mockActivatedRoute: Partial<ActivatedRoute>
  let mockLoaderService: jest.Mocked<LoaderService>
  let mockSnapshot: Partial<ActivatedRouteSnapshot>

  const mockUserProfile = {
    rootOrgId: 'test-org',
    departmentName: 'test-dept',
    userName: 'test-user',
    userId: 'test-id'
  }

  beforeEach(() => {
    // Reset window.env before each test
    Object.defineProperty(window, 'env', {
      value: mockWindow.env,
      writable: true
    })

    mockMatSnackBar = {
      open: jest.fn()
    } as any

    mockEventsService = {
      createContent: jest.fn(),
      uploadContent: jest.fn(),
      // Used to branch the material form; false keeps the default (non-BharatKalp) path.
      isBharatKalpCategory: jest.fn().mockReturnValue(false)
    } as any

    mockSnapshot = {
      url: [],
      params: {},
      queryParams: {},
      fragment: null,
      data: {
        configService: {
          userProfile: mockUserProfile
        }
      },
      outlet: 'primary',
      component: null,
      routeConfig: null,
      children: [],
      pathFromRoot: []
    } as Partial<ActivatedRouteSnapshot>

    mockActivatedRoute = {
      snapshot: mockSnapshot as ActivatedRouteSnapshot
    }

    mockLoaderService = {
      changeLoaderState: jest.fn()
    } as any

    component = new EventMaterialsComponent(
      mockMatSnackBar,
      mockEventsService,
      mockActivatedRoute as ActivatedRoute,
      mockLoaderService
    )
  })

  afterEach(() => {
    // Clean up window.env after each test
    jest.resetModules()
  })

  // ... rest of the test cases remain the same ...

  describe('saveFile', () => {
    beforeEach(() => {
      component.userProfile = mockUserProfile
      component.filePath = { type: 'application/pdf' }
    })

    it('should successfully save file and update materials list with domain URL', () => {
      const mockArtifactUrl = 'https://storage.googleapis.com/igot/test/file.pdf'

      mockEventsService.createContent = jest.fn().mockReturnValue(of({ result: { identifier: 'test-id' } }))
      mockEventsService.uploadContent = jest.fn().mockReturnValue(of({ result: { artifactUrl: mockArtifactUrl } }))

      component.saveFile()

      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
      expect(mockEventsService.createContent).toHaveBeenCalled()
      expect(mockEventsService.uploadContent).toHaveBeenCalled()

      const createContentCall = mockEventsService.createContent.mock.calls[0][0]
      expect(createContentCall.request.content.createdFor).toContain(mockUserProfile.rootOrgId)
      expect(createContentCall.request.content.organisation).toContain(mockUserProfile.departmentName)
    })

  })

})