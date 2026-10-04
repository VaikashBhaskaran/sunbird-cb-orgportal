import { TestBed } from '@angular/core/testing'

import { commonTestingProviders } from '@test/helpers/testing-providers'
import { AchievementsService } from './achievements.service'

describe('AchievementsService', () => {
  let service: AchievementsService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    })
    service = TestBed.inject(AchievementsService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
