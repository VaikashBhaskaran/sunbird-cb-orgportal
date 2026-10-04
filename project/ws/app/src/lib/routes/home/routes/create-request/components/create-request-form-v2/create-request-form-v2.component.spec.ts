import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { CreateRequestFormV2Component } from './create-request-form-v2.component';

describe('CreateRequestFormV2Component', () => {
  let component: CreateRequestFormV2Component;
  let fixture: ComponentFixture<CreateRequestFormV2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateRequestFormV2Component, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(CreateRequestFormV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
