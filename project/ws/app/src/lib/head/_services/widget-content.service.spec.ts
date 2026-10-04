import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { WidgetContentService } from './widget-content.service'

describe('WidgetContentService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: WidgetContentService = TestBed.inject(WidgetContentService)
    expect(service).toBeTruthy()
  })
})
