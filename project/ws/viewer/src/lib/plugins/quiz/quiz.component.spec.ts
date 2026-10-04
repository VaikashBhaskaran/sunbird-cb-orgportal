import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { QuizComponent } from './quiz.component'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes, viewerRouteData } from '@test/helpers/testing-providers'

describe('QuizComponent', () => {
  let component: QuizComponent
  let fixture: ComponentFixture<QuizComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestingProviders({ routeData: viewerRouteData() })],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [QuizComponent, ...stubPipes()],
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
