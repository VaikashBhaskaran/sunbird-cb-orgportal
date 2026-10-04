import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes, viewerRouteData } from '@test/helpers/testing-providers'
import { HtmlPickerComponent } from './html-picker.component'

describe('HtmlPickerComponent', () => {
  let component: HtmlPickerComponent
  let fixture: ComponentFixture<HtmlPickerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HtmlPickerComponent, ...stubPipes()],
      providers: [...commonTestingProviders({ routeData: viewerRouteData() })],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlPickerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
