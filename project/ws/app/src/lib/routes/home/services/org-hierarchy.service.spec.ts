import { TestBed } from '@angular/core/testing';

import { commonTestingProviders } from '@test/helpers/testing-providers';
import { OrgHierarchyService } from './org-hierarchy.service';

describe('OrgHierarchyService', () => {
  let service: OrgHierarchyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    });
    service = TestBed.inject(OrgHierarchyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
