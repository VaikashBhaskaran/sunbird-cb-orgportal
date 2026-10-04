import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { AssessmentFooterComponent } from './assessment-footer.component'

describe('AssessmentFooterComponent', () => {
  let component: AssessmentFooterComponent
  let fixture: ComponentFixture<AssessmentFooterComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AssessmentFooterComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssessmentFooterComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
