import { TestBed } from '@angular/core/testing';

import { commonTestingProviders } from '@test/helpers/testing-providers';
import { ExploreContentService } from './explore-content.service';

describe('ExploreContentService', () => {
  let service: ExploreContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    });
    service = TestBed.inject(ExploreContentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
