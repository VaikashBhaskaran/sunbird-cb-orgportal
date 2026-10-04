import { TestBed, inject } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { EmptyRouteGuard } from './empty-route.guard'

describe('EmptyRouteGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonTestingProviders(),EmptyRouteGuard],
    })
  })

  it('should ...', inject([EmptyRouteGuard], (guard: EmptyRouteGuard) => {
    expect(guard).toBeTruthy()
  }))
})
