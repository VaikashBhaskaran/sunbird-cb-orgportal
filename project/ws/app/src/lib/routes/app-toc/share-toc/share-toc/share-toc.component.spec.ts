import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

import { of } from 'rxjs'

import { AppTocService } from '../../services/app-toc.service'
import { ShareTocModule } from '../share-toc.module'
import { ShareTocComponent } from './share-toc.component'

describe('ShareTocComponent', () => {
  let component: ShareTocComponent
  let fixture: ComponentFixture<ShareTocComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      // Importing the real module keeps the template's Material dependencies in step with
      // production instead of restating them here. TranslateModule.forRoot() supplies the
      // TranslateService that MultilingualTranslationsService needs.
      imports: [ShareTocModule, TranslateModule.forRoot()],
      // The component pulls in UserAutocompleteService, which injects HttpClient.
      // AppTocService is declared by AppTocModule rather than provided in root, so the
      // component only needs a stand-in for the one method it calls.
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppTocService, useValue: { shareContent: jest.fn(() => of({})) } },
        // EventService (@sunbird-cb/utils-v2) injects the 'environment' token, which the
        // application supplies from app.module.ts.
        { provide: 'environment', useValue: {} },
        // UtilityService, reached through EventService, injects ActivatedRoute.
        provideRouter([]),
      ],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareTocComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
