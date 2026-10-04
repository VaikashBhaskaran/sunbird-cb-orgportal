import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, pageRouteData, stubPipes } from '@test/helpers/testing-providers'
import { OnboardingComponent } from './onboarding.component'

describe('OnboardingComponent', () => {
  let component: OnboardingComponent
  let fixture: ComponentFixture<OnboardingComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OnboardingComponent, ...stubPipes()],
      providers: [...commonTestingProviders({ routeData: pageRouteData() })],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(OnboardingComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
