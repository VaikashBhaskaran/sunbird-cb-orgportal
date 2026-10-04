import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { EventService } from './event.service'
import { EventResolverService } from './event-resolver.service'

describe('EventResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      // The service under test is not providedIn:'root', so it must be listed here.
      providers: [EventService, EventResolverService, ...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: EventResolverService = TestBed.inject(EventResolverService)
    expect(service).toBeTruthy()
  })
})
