import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { TrainingPlanDashboardviewComponent } from './training-plan-dashboardview.component';

describe('TrainingPlanDashboardviewComponent', () => {
  let component: TrainingPlanDashboardviewComponent;
  let fixture: ComponentFixture<TrainingPlanDashboardviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TrainingPlanDashboardviewComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(TrainingPlanDashboardviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
