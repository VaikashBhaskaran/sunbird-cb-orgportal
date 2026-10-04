import { TestBed } from '@angular/core/testing';

import { commonTestingProviders } from '@test/helpers/testing-providers';
import { CreateRequestService } from './create-request.service';

describe('CreateRequestService', () => {
  let service: CreateRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestingProviders()],
    });
    service = TestBed.inject(CreateRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
