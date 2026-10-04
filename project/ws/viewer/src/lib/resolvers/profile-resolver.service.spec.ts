import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { ProfileResolverService } from './profile-resolver.service'

describe('ProfileResolverService', () => {
  // The resolver is @Injectable() without providedIn, so ViewerModule provides it in
  // the app and a TestBed has to do the same. It injects HttpClient.
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), ProfileResolverService],
  }))

  it('should be created', () => {
    const service: ProfileResolverService = TestBed.inject(ProfileResolverService)
    expect(service).toBeTruthy()
  })
})
