import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { AssessmentPerformanceInsightSummaryComponent } from './assessment-performance-insight-summary.component'

describe('AssessmentPerformanceInsightSummaryComponent', () => {
  let component: AssessmentPerformanceInsightSummaryComponent
  let fixture: ComponentFixture<AssessmentPerformanceInsightSummaryComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AssessmentPerformanceInsightSummaryComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssessmentPerformanceInsightSummaryComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
