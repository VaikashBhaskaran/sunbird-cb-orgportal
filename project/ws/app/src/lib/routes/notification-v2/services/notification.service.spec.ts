import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      // The service under test is not providedIn:'root', so it must be listed here.
      providers: [NotificationService, ...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: NotificationService = TestBed.inject(NotificationService)
    expect(service).toBeTruthy()
  })
})
