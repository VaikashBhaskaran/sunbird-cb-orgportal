import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonMaterialModules, commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { ApprovalsListComponent } from './approvals-list.component';

describe('ApprovalsListComponent', () => {
  let component: ApprovalsListComponent;
  let fixture: ComponentFixture<ApprovalsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApprovalsListComponent, ...stubPipes()],
      // The template references these by export name (#x="matMenu"), which NO_ERRORS_SCHEMA
      // cannot satisfy.
      imports: [...commonMaterialModules()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(ApprovalsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
