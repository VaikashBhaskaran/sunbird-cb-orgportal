import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonMaterialModules, commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { DirectoryTableComponent } from './directory-table.component';

describe('DirectoryTableComponent', () => {
  let component: DirectoryTableComponent;
  let fixture: ComponentFixture<DirectoryTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DirectoryTableComponent, ...stubPipes()],
      // The template references these by export name (#x="matMenu"), which NO_ERRORS_SCHEMA
      // cannot satisfy.
      imports: [...commonMaterialModules()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(DirectoryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
