import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'

import { AppTocService } from '@ws/app/src/lib/routes/app-toc/services/app-toc.service'
import { PdfScormDataService } from '../../pdf-scorm-data-service'
import { commonTestingProviders, viewerRouteData } from '@test/helpers/testing-providers'

import { ViewerSecondaryTopBarComponent } from './viewer-secondary-top-bar.component'

describe('ViewerSecondaryTopBarComponent', () => {
  let component: ViewerSecondaryTopBarComponent
  let fixture: ComponentFixture<ViewerSecondaryTopBarComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ViewerSecondaryTopBarComponent],
      providers: [
        ...commonTestingProviders({ routeData: viewerRouteData() }),
        // Both members are Subjects the component subscribes to.
        {
          provide: PdfScormDataService,
          useValue: {
            handlePdfMarkComplete: new Subject(),
            handleBackFromPdfScormFullScreen: new Subject(),
          },
        },
        {
          // getPageScroll is a BehaviorSubject on the real service and updatePageScroll is
          // its observable view; the component subscribes to the latter.
          provide: AppTocService,
          useValue: (() => {
            const getPageScroll = new BehaviorSubject(true)
            return { getPageScroll, updatePageScroll: getPageScroll.asObservable() }
          })(),
        },
      ],
      // These are shallow smoke tests: the child components the template renders are
      // not declared here, so their selectors and inputs are unknown to the TestBed.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewerSecondaryTopBarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
