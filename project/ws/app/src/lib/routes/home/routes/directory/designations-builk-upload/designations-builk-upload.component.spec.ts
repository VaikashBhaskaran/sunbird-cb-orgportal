import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { UsersService } from '../../../../users/services/users.service';
import { FileService } from '../../../../users/services/upload.service';
import { ConfigurationsService } from '@sunbird-cb/utils-v2';
import { DesignationsBuilkUploadComponent } from './designations-builk-upload.component';

describe('DesignationsBuilkUploadComponent', () => {
  let component: DesignationsBuilkUploadComponent;
  let fixture: ComponentFixture<DesignationsBuilkUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DesignationsBuilkUploadComponent, ...stubPipes()],
      // FileService is provided by the feature module, not in root.
      providers: [
        UsersService,
        FileService,
        // ngOnInit reads configSvc.userProfileV2.userId straight away.
        {
          provide: ConfigurationsService,
          useValue: {
            userProfile: { rootOrgId: 'test-org' },
            userProfileV2: { userId: 'test-user' },
          },
        },
        ...commonTestingProviders(),
      ],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(DesignationsBuilkUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
