import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers'
import { LoadingPopupComponent } from './loading-popup.component'

describe('LoadingPopupComponent', () => {
  let component: LoadingPopupComponent
  let fixture: ComponentFixture<LoadingPopupComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoadingPopupComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingPopupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
