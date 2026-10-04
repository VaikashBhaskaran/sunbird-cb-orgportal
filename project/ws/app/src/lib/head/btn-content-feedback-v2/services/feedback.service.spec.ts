import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { FeedbackService } from './feedback.service'

describe('FeedbackService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: FeedbackService = TestBed.inject(FeedbackService)
    expect(service).toBeTruthy()
  })
})
