import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { BulkUploadOrgComponent } from './bulk-upload-org.component';

describe('BulkUploadOrgComponent', () => {
  let component: BulkUploadOrgComponent;
  let fixture: ComponentFixture<BulkUploadOrgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BulkUploadOrgComponent, ...stubPipes()],
      providers: [...commonTestingProviders({
        // ngOnInit reads the framework id straight off the dialog payload and splits it,
        // with no guard, so the dialog data has to carry one.
        dialogData: {
          bulkUploadConfig: {
            frameworkData: { orgHierarchyFrameworkId: 'test-org_framework' },
            // The template guards bulkUploadConfig but then reaches through
            // sampleFileDownloadInstructuons without one (note the spelling).
            sampleFileDownloadInstructuons: { instructions: [] },
          },
        },
      })],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(BulkUploadOrgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
