import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers'
import { UserOnboardingComponent } from './user-onboarding.component'

describe('UserOnboardingComponent', () => {
  let component: UserOnboardingComponent
  let fixture: ComponentFixture<UserOnboardingComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserOnboardingComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    })
    fixture = TestBed.createComponent(UserOnboardingComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
