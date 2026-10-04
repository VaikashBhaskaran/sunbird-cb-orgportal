import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { BtnPlaylistService, WidgetContentService } from '@sunbird-cb/collection'
import { of } from 'rxjs'

import { commonTestingProviders, pageRouteData, stubPipes } from '@test/helpers/testing-providers'
import { InterestComponent } from './interest.component'

describe('InterestComponent', () => {
  let component: InterestComponent
  let fixture: ComponentFixture<InterestComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InterestComponent, ...stubPipes()],
      providers: [
        ...commonTestingProviders({ routeData: pageRouteData() }),
        // The real service keeps an internal Subject that only its own module sets up;
        // ngOnInit subscribes to getAllPlaylists() straight away.
        { provide: BtnPlaylistService, useValue: { getAllPlaylists: () => of([]) } },
        // ngOnInit also fetches the content behind the first interest.
        { provide: WidgetContentService, useValue: { fetchMultipleContent: () => of([]) } },
      ],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(InterestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
