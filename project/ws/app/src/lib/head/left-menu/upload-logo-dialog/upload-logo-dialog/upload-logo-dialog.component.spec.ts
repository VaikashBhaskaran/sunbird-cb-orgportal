import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers'
import { UploadLogoDialogComponent } from './upload-logo-dialog.component'

describe('UploadLogoDialogComponent', () => {
  let component: UploadLogoDialogComponent
  let fixture: ComponentFixture<UploadLogoDialogComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadLogoDialogComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadLogoDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})