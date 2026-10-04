import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { ResourceCollectionService } from './resource-collection.service'

describe('ResourceCollectionService', () => {
  // The service injects HttpClient, which a bare TestBed does not provide.
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }))

  it('should be created', () => {
    const service: ResourceCollectionService = TestBed.inject(ResourceCollectionService)
    expect(service).toBeTruthy()
  })
})
