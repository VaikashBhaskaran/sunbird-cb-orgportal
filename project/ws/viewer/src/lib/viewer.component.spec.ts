import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { ViewerComponent } from './viewer.component'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes, viewerRouteData } from '@test/helpers/testing-providers'
import { AppTocService } from '@ws/app/src/lib/routes/app-toc/services/app-toc.service'
import { PendingFunctionService } from './services/pending-function.service'
import { PdfScormDataService } from './pdf-scorm-data-service'

describe('ViewerComponent', () => {
  let component: ViewerComponent
  let fixture: ComponentFixture<ViewerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonTestingProviders({ routeData: viewerRouteData() }),
        // Declared @Injectable() without providedIn, so ViewerModule provides it in the
        // app; it has no dependencies of its own.
        PdfScormDataService,
        // These are provided by AppTocModule and ViewerModule in the app rather than in
        // root, so a shallow TestBed has to stand them in.
        { provide: AppTocService, useValue: {} },
        PendingFunctionService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ViewerComponent, ...stubPipes()],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
