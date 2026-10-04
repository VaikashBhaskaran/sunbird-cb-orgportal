import { TestBed, inject } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { LoginGuard } from './login.guard'

describe('LoginGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonTestingProviders(),LoginGuard],
    })
  })

  it('should ...', inject([LoginGuard], (guard: LoginGuard) => {
    expect(guard).toBeTruthy()
  }))
})
