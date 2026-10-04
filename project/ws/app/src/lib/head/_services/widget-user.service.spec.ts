import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { WidgetUserService } from './widget-user.service'

describe('WidgetUserService', () => {
  beforeEach(() => TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    }))

  it('should be created', () => {
    const service: WidgetUserService = TestBed.inject(WidgetUserService)
    expect(service).toBeTruthy()
  })
})
