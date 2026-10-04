import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { OrgHierarchyMappingComponent } from './org-hierarchy-mapping.component';

describe('OrgHierarchyMappingComponent', () => {
  let component: OrgHierarchyMappingComponent;
  let fixture: ComponentFixture<OrgHierarchyMappingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrgHierarchyMappingComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(OrgHierarchyMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
