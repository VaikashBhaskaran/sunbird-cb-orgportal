import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { ContentNominateLearnerComponent } from './content-nominate-learner.component';

describe('ContentNominateLearnerComponent', () => {
  let component: ContentNominateLearnerComponent;
  let fixture: ComponentFixture<ContentNominateLearnerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContentNominateLearnerComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(ContentNominateLearnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
