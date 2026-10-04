import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { AssessmentQuestionCountContainerComponent } from './assessment-question-count-container.component'

describe('AssessmentQuestionCountContainerComponent', () => {
  let component: AssessmentQuestionCountContainerComponent
  let fixture: ComponentFixture<AssessmentQuestionCountContainerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AssessmentQuestionCountContainerComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssessmentQuestionCountContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
