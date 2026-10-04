import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { SignupAutoService } from './signup-auto.service'

describe('SignupAutoService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      // The service under test is not providedIn:'root', so it must be listed here.
      providers: [SignupAutoService, ...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: SignupAutoService = TestBed.inject(SignupAutoService)
    expect(service).toBeTruthy()
  })
})
