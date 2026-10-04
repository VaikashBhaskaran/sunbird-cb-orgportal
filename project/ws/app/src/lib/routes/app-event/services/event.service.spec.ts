import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { EventService } from './event.service'

describe('EventService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      // The service under test is not providedIn:'root', so it must be listed here.
      providers: [EventService, ...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: EventService = TestBed.inject(EventService)
    expect(service).toBeTruthy()
  })
})
