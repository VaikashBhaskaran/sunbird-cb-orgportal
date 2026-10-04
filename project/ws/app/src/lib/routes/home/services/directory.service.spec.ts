import { TestBed } from '@angular/core/testing';

import { commonTestingProviders } from '@test/helpers/testing-providers';
import { DirectoryService } from './directory.service';

describe('DirectoryService', () => {
  let service: DirectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    });
    service = TestBed.inject(DirectoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
