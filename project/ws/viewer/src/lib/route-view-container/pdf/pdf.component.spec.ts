import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Subject } from 'rxjs'

import { PdfScormDataService } from '../../pdf-scorm-data-service'

import { commonTestingProviders, viewerRouteData } from '@test/helpers/testing-providers'

import { PdfComponent } from './pdf.component'

describe('PdfComponent', () => {
  let component: PdfComponent
  let fixture: ComponentFixture<PdfComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PdfComponent],
      providers: [
        ...commonTestingProviders({ routeData: viewerRouteData() }),
        {
          provide: PdfScormDataService,
          // Both members are Subjects on the real service, and the component subscribes
          // to them rather than calling them.
          useValue: {
            handlePdfMarkComplete: new Subject(),
            handleBackFromPdfScormFullScreen: new Subject(),
          },
        },
      ],
      // These are shallow smoke tests: the child components the template renders are
      // not declared here, so their selectors and inputs are unknown to the TestBed.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
