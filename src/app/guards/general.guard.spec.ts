import { TestBed, inject } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { GeneralGuard } from './general.guard'

describe('GeneralGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonTestingProviders(),GeneralGuard],
    })
  })

  it('should ...', inject([GeneralGuard], (guard: GeneralGuard) => {
    expect(guard).toBeTruthy()
  }))
})
