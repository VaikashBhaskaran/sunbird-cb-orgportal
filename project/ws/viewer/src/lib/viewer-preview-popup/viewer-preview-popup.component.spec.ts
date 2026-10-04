import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'

import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers'
import { ViewerPreviewPopupComponent } from './viewer-preview-popup.component'

describe('ViewerPreviewPopupComponent', () => {
  let component: ViewerPreviewPopupComponent
  let fixture: ComponentFixture<ViewerPreviewPopupComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      // The component is standalone, so it is imported rather than declared.
      imports: [ViewerPreviewPopupComponent],
      declarations: [...stubPipes()],
      providers: [...commonTestingProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewerPreviewPopupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
