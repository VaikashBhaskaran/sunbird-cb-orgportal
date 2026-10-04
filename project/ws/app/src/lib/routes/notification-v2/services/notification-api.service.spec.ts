import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { NotificationApiService } from './notification-api.service'

describe('NotificationApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      // The service under test is not providedIn:'root', so it must be listed here.
      providers: [NotificationApiService, ...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: NotificationApiService = TestBed.inject(NotificationApiService)
    expect(service).toBeTruthy()
  })
})
