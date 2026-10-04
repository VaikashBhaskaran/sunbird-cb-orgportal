import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { EventDetailsComponent } from './event-details.component';

describe('EventDetailsComponent', () => {
  let component: EventDetailsComponent;
  let fixture: ComponentFixture<EventDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventDetailsComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(EventDetailsComponent);
    component = fixture.componentInstance;
    // applyFormRulesBasedOnStatus reads endDateTime and status off this input without
    // guarding, so it has to be bound before the first change detection.
    component.eventDetailsData = { status: 'Draft', endDateTime: '' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
