import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { CustomFieldsService } from '../../../../users/custom-fields.service';
import { FileService } from '../../../../users/services/upload.service';
import { CreateFormComponent } from './create-form.component';

describe('CreateFormComponent', () => {
  let component: CreateFormComponent;
  let fixture: ComponentFixture<CreateFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateFormComponent, ...stubPipes()],
      // FileService is provided by the feature module, not in root.
      providers: [CustomFieldsService, FileService, ...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(CreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
