import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { MicrositeV1Component } from './microsite-v1.component';

describe('MicrositeV1Component', () => {
  let component: MicrositeV1Component;
  let fixture: ComponentFixture<MicrositeV1Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MicrositeV1Component, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(MicrositeV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
