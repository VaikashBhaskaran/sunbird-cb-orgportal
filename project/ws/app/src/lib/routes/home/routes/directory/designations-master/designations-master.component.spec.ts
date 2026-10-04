import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, pageRouteData, stubPipes } from '@test/helpers/testing-providers';
import { DesignationsMasterComponent } from './designations-master.component';

describe('DesignationsMasterComponent', () => {
  let component: DesignationsMasterComponent;
  let fixture: ComponentFixture<DesignationsMasterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DesignationsMasterComponent, ...stubPipes()],
      providers: [...commonTestingProviders({ routeData: pageRouteData() })],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(DesignationsMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
