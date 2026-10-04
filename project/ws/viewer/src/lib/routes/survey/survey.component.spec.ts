import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, viewerRouteData } from '@test/helpers/testing-providers'

import { SurveyComponent } from './survey.component'

describe('SurveyComponent', () => {
  let component: SurveyComponent
  let fixture: ComponentFixture<SurveyComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SurveyComponent],
      providers: [...commonTestingProviders({ routeData: viewerRouteData() })],
      // These are shallow smoke tests: the child components the template renders are
      // not declared here, so their selectors and inputs are unknown to the TestBed.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveyComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
