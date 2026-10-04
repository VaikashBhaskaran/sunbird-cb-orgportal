import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { UsersService } from '../../../../users/services/users.service';
import { FileService } from '../../../../users/services/upload.service';
import { UserBulkTransferComponent } from './user-bulk-transfer.component';

describe('UserBulkTransferComponent', () => {
  let component: UserBulkTransferComponent;
  let fixture: ComponentFixture<UserBulkTransferComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserBulkTransferComponent, ...stubPipes()],
      // FileService is provided by the feature module, not in root.
      providers: [UsersService, FileService, ...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(UserBulkTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
