import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { FracService } from './frac.service'

describe('FracService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: FracService = TestBed.inject(FracService)
    expect(service).toBeTruthy()
  })
})
