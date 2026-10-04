import { TestBed } from '@angular/core/testing';

import { commonTestingProviders } from '@test/helpers/testing-providers';
import { CommunityResolverService } from './community-resolver.service';

describe('CommunityResolverService', () => {
  let service: CommunityResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    });
    service = TestBed.inject(CommunityResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
