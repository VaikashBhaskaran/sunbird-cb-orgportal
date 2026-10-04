import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { SignupService } from './signup.service'

describe('SignupService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: SignupService = TestBed.inject(SignupService)
    expect(service).toBeTruthy()
  })
})
