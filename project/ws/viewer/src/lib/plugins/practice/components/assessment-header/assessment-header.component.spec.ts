import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { AssessmentHeaderComponent } from './assessment-header.component'

describe('AssessmentHeaderComponent', () => {
  let component: AssessmentHeaderComponent
  let fixture: ComponentFixture<AssessmentHeaderComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AssessmentHeaderComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssessmentHeaderComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
