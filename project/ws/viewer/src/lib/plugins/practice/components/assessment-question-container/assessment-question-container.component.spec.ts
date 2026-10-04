import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { AssessmentQuestionContainerComponent } from './assessment-question-container.component'

describe('AssessmentQuestionContainerComponent', () => {
  let component: AssessmentQuestionContainerComponent
  let fixture: ComponentFixture<AssessmentQuestionContainerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AssessmentQuestionContainerComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssessmentQuestionContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
