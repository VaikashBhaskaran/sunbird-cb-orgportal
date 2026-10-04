import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes, viewerRouteData } from '@test/helpers/testing-providers'
import { HandsOnComponent } from './hands-on.component'

describe('HandsOnComponent', () => {
  let component: HandsOnComponent
  let fixture: ComponentFixture<HandsOnComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HandsOnComponent, ...stubPipes()],
      providers: [...commonTestingProviders({ routeData: viewerRouteData() })],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HandsOnComponent)
    component = fixture.componentInstance
    // The template indexes straight into (exerciseData?.supportedLanguages)[0], which the
    // safe-navigation does not cover, so the data has to be in place before the first
    // change detection. Recorded in product-bugs.md.
    component.exerciseData = {
      supportedLanguages: [{ language: 'java', mode: 'java' }],
      starterCodes: [''],
    } as any
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
