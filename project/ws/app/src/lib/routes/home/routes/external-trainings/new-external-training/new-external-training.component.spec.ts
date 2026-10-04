import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { NewExternalTrainingComponent } from './new-external-training.component';

describe('NewExternalTrainingComponent', () => {
  let component: NewExternalTrainingComponent;
  let fixture: ComponentFixture<NewExternalTrainingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewExternalTrainingComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(NewExternalTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
