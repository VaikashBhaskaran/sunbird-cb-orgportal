import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonMaterialModules, commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { AddModeratorComponent } from './add-moderator.component';

describe('AddModeratorComponent', () => {
  let component: AddModeratorComponent;
  let fixture: ComponentFixture<AddModeratorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddModeratorComponent, ...stubPipes()],
      // The template references these by export name (#x="matMenu"), which NO_ERRORS_SCHEMA
      // cannot satisfy.
      imports: [...commonMaterialModules()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(AddModeratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
