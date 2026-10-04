import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { ConfigResolverService } from './config-resolver.service'

describe('ConfigResolverService', () => {
  // The class this module exports is ConfigResolverService; ConfigurationsService is the
  // @sunbird-cb/utils-v2 service it injects. It is @Injectable() without providedIn, so
  // ViewerModule provides it in the app and the TestBed has to do the same.
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), ConfigResolverService],
  }))

  it('should be created', () => {
    const service: ConfigResolverService = TestBed.inject(ConfigResolverService)
    expect(service).toBeTruthy()
  })
})
