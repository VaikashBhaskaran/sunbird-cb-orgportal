import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes, viewerRouteData } from '@test/helpers/testing-providers'
import { QuizComponent } from './quiz.component'

describe('QuizComponent', () => {
  let component: QuizComponent
  let fixture: ComponentFixture<QuizComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [QuizComponent, ...stubPipes()],
      providers: [...commonTestingProviders({ routeData: viewerRouteData() })],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(QuizComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
